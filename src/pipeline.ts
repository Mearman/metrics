/**
 * Pipeline orchestrator — config → fetch → render → write.
 *
 * This is the core of the metrics generator. It:
 * 1. Loads config via cosmiconfig
 * 2. Creates an authenticated API client
 * 3. For each output, fetches plugin data, renders SVG, writes file
 */

import type { RootConfig } from "./config/schema.ts";
import { createClient } from "./api/client.ts";
import { serialise } from "./render/svg/serialise.ts";
import { svg, rect, line } from "./render/svg/builder.ts";
import { getPlugin } from "./plugins/registry.ts";
import { registerAllPlugins } from "./plugins/register.ts";
import { createMeasure } from "./render/layout/measure.ts";
import { resolveTheme } from "./render/template/themes.ts";
import { createIconLookup } from "./render/svg/icons.ts";
import { embeddedFontCss } from "./render/svg/font-embed.ts";
import { inlineImages, clearImageCache } from "./render/svg/inline-images.ts";
import type { RenderResult } from "./plugins/types.ts";

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface PipelineResult {
  outputs: OutputResult[];
}

export interface OutputResult {
  path: string;
  byteSize: number;
}

// Register all known plugins on module load
registerAllPlugins();

/**
 * Run the full metrics generation pipeline.
 *
 * @param config  - Validated root config
 * @param token   - GitHub token for API access
 * @param options - Dry-run mode suppresses file writes
 */
export async function runPipeline(
  config: RootConfig,
  token: string,
  options?: { dryRun?: boolean },
): Promise<PipelineResult> {
  const api = createClient(token);
  const dryRun = options?.dryRun ?? false;
  const measure = createMeasure();
  const icons = createIconLookup();
  const results: OutputResult[] = [];

  const username = config.user ?? "unknown";

  for (const output of config.outputs) {
    const theme = resolveTheme(config.template);
    const contentWidth = theme.width - theme.margin * 2;
    const renderResults: RenderResult[] = [];
    const controller = new AbortController();

    // Fetch + render each enabled plugin
    for (const [pluginId, pluginConfig] of Object.entries(output.plugins)) {
      const plugin = getPlugin(pluginId);
      if (plugin === undefined) {
        console.warn(`Unknown plugin "${pluginId}" — skipping`);
        continue;
      }

      // Parse plugin config through its Zod schema to apply defaults
      const parsedConfig = plugin.source.configSchema.safeParse(pluginConfig);
      const resolvedConfig = parsedConfig.success
        ? parsedConfig.data
        : pluginConfig;

      // Fetch data
      let data: unknown;
      try {
        data = await plugin.source.fetch(
          {
            api,
            user: username,
            signal: controller.signal,
            token,
            repos: config.repos,
          },
          resolvedConfig,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `Plugin "${pluginId}" fetch failed: ${message} — skipping`,
        );
        continue;
      }

      // Render
      const result = plugin.renderer.render(data, resolvedConfig, {
        measure,
        theme,
        icons,
        contentWidth,
      });

      renderResults.push(result);
    }

    // Layout: stack sections vertically with dividers
    const totalHeight = renderResults.reduce(
      (sum, r) => sum + r.height,
      theme.margin * 2,
    );

    const dividerGap = 8;
    const sections: import("./render/svg/builder.ts").SvgElement[] = [];

    for (const [index, result] of renderResults.entries()) {
      if (result.elements.length === 0) continue;

      const yOffset = renderResults
        .slice(0, index)
        .reduce((sum, r) => sum + r.height, theme.margin);

      // Add a divider line before each section (except the first)
      if (sections.length > 0) {
        sections.push(
          line(
            theme.margin,
            yOffset - dividerGap / 2,
            theme.width - theme.margin,
            yOffset - dividerGap / 2,
            {
              stroke: theme.colours.border,
              "stroke-width": 0.5,
              opacity: 0.6,
            },
          ),
        );
      }

      // Offset each section's elements by its Y position in the stack
      for (const element of result.elements) {
        sections.push(offsetElement(element, 0, yOffset));
      }
    }

    // Font embedding for cross-host rendering (configurable)
    const children: import("./render/svg/builder.ts").SvgElement[] = [];
    if (config.embed_fonts) {
      const fontCss = embeddedFontCss();
      children.push({ tag: "style", attrs: {}, text: fontCss });
    }

    // Background
    children.push(
      rect(0, 0, theme.width, totalHeight, {
        fill: theme.colours.background,
        rx: 6,
      }),
    );

    // Sections
    children.push(...sections);

    // Wrap in root SVG element
    const root = svg(
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: theme.width,
        height: totalHeight,
        viewBox: `0 0 ${String(theme.width)} ${String(totalHeight)}`,
        role: "img",
        "aria-label": `Metrics for ${username}`,
      },
      ...children,
    );

    // Inline external images (avatars) as base64 data URIs
    // so they render in any context (embedded <img>, direct URL, etc.)
    const withInlinedImages = await inlineImages(root);
    clearImageCache();

    const svgContent = serialise(withInlinedImages);

    if (!dryRun) {
      const { writeSvg } = await import("./output/svg.ts");
      await writeSvg(output.path, svgContent);
    }

    results.push({
      path: output.path,
      byteSize: new TextEncoder().encode(svgContent).byteLength,
    });
  }

  return { outputs: results };
}

/**
 * Deep-offset an SvgElement tree by (dx, dy).
 *
 * Composes with any existing transform rather than overwriting.
 * SVG transforms are applied right-to-left, so existing transform
 * runs first, then the offset.
 */
function offsetElement(
  element: import("./render/svg/builder.ts").SvgElement,
  dx: number,
  dy: number,
): import("./render/svg/builder.ts").SvgElement {
  if (dx === 0 && dy === 0) return element;

  const existing = element.attrs.transform;
  const offset = `translate(${String(dx)},${String(dy)})`;
  const transform =
    existing !== undefined && typeof existing === "string"
      ? `${offset} ${existing}`
      : offset;

  return {
    ...element,
    attrs: {
      ...element.attrs,
      transform,
    },
  };
}
