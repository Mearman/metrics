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
import { svg, rect, line, g } from "./render/svg/builder.ts";
import { getPlugin } from "./plugins/registry.ts";
import { registerAllPlugins } from "./plugins/register.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reorder plugin entries according to an explicit order list.
 *
 * Plugins named in `order` come first (in that order);
 * any plugins not listed are appended in their original key order.
 */
function reorderPlugins(
  entries: [string, unknown][],
  order: string[] | undefined,
): [string, unknown][] {
  if (order === undefined || order.length === 0) return entries;

  const entryMap = new Map(entries);
  const result: [string, unknown][] = [];

  // Add plugins in the specified order
  for (const id of order) {
    const config = entryMap.get(id);
    if (config !== undefined) {
      result.push([id, config]);
      entryMap.delete(id);
    }
  }

  // Append remaining plugins in their original order
  for (const [id, config] of entryMap) {
    result.push([id, config]);
  }

  return result;
}
import { createMeasure } from "./render/layout/measure.ts";
import { resolveTheme } from "./render/template/themes.ts";
import { createIconLookup } from "./render/svg/icons.ts";
import { embeddedFontCss } from "./render/svg/font-embed.ts";
import { inlineImages, clearImageCache } from "./render/svg/inline-images.ts";
import type { RenderResult, ApiClient } from "./plugins/types.ts";

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
  options?: { dryRun?: boolean; api?: ApiClient },
): Promise<PipelineResult> {
  const api = options?.api ?? createClient(token);
  const dryRun = options?.dryRun ?? false;
  const measure = createMeasure();
  const icons = createIconLookup();
  const results: OutputResult[] = [];

  const username = config.user ?? "unknown";

  for (const output of config.outputs) {
    const theme = resolveTheme(config.template);
    // Apply colour overrides from config
    if (config.colours) {
      const calOverrides = config.colours.calendar;
      if (calOverrides !== undefined) {
        const merged = { ...theme.colours.calendar };
        if (calOverrides.L0 !== undefined) merged.L0 = calOverrides.L0;
        if (calOverrides.L1 !== undefined) merged.L1 = calOverrides.L1;
        if (calOverrides.L2 !== undefined) merged.L2 = calOverrides.L2;
        if (calOverrides.L3 !== undefined) merged.L3 = calOverrides.L3;
        if (calOverrides.L4 !== undefined) merged.L4 = calOverrides.L4;
        theme.colours.calendar = merged;
      }
      if (config.colours.text !== undefined)
        theme.colours.text = config.colours.text;
      if (config.colours.textSecondary !== undefined)
        theme.colours.textSecondary = config.colours.textSecondary;
      if (config.colours.textTertiary !== undefined)
        theme.colours.textTertiary = config.colours.textTertiary;
      if (config.colours.accent !== undefined)
        theme.colours.accent = config.colours.accent;
      if (config.colours.background !== undefined)
        theme.colours.background = config.colours.background;
      if (config.colours.border !== undefined)
        theme.colours.border = config.colours.border;
      if (config.colours.error !== undefined)
        theme.colours.error = config.colours.error;
      if (config.colours.warning !== undefined)
        theme.colours.warning = config.colours.warning;
      if (config.colours.success !== undefined)
        theme.colours.success = config.colours.success;
    }
    const contentWidth = theme.width - theme.margin * 2;
    const renderResults: RenderResult[] = [];
    const renderPluginIds: string[] = [];
    const controller = new AbortController();

    // Reorder plugins if an explicit order is set
    const pluginEntries = Object.entries(output.plugins);
    const orderedEntries = reorderPlugins(pluginEntries, output.order);

    // Fetch + render each enabled plugin
    for (const [pluginId, pluginConfig] of orderedEntries) {
      const plugin = getPlugin(pluginId);
      if (plugin === undefined) {
        console.warn(`Unknown plugin "${pluginId}" — skipping`);
        continue;
      }

      // Parse plugin config through its Zod schema to apply defaults
      const parsedConfig = plugin.source.configSchema.safeParse(pluginConfig);
      let resolvedConfig = parsedConfig.success
        ? parsedConfig.data
        : pluginConfig;

      // Inject LoC cache directory from environment if not explicitly set
      if (
        plugin.id === "loc" &&
        typeof resolvedConfig === "object" &&
        resolvedConfig !== null &&
        "cache_dir" in resolvedConfig &&
        resolvedConfig.cache_dir === "" &&
        process.env.METRICS_LOC_CACHE !== undefined &&
        process.env.METRICS_LOC_CACHE !== ""
      ) {
        resolvedConfig = {
          ...resolvedConfig,
          cache_dir: process.env.METRICS_LOC_CACHE,
        };
      }

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
            usersIgnored: config.users_ignored,
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
        repos: config.repos,
      });

      renderResults.push(result);
      renderPluginIds.push(pluginId);
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
              "stroke-width": 1,
              opacity: 0.4,
            },
          ),
        );
      }

      // Wrap each section in a group with a <title> for
      // screen reader navigation
      const pluginId = renderPluginIds[index];
      if (pluginId === undefined) continue;
      const sectionTitleId = `section-${pluginId}`;
      const sectionElements = result.elements.map((element) =>
        offsetElement(element, 0, yOffset),
      );
      sections.push(
        g(
          { "aria-labelledby": sectionTitleId },
          {
            tag: "title",
            attrs: { id: sectionTitleId },
            text: pluginId,
          },
          ...sectionElements,
        ),
      );
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
      // Accessible title — first child of <svg> for screen readers
      { tag: "title", attrs: {}, text: `Metrics for ${username}` },
      ...children,
    );

    // Inline external images (avatars) as base64 data URIs
    // so they render in any context (embedded <img>, direct URL, etc.)
    const withInlinedImages = await inlineImages(root);
    clearImageCache();

    const svgContent = serialise(withInlinedImages);

    if (!dryRun) {
      if (output.format === "png") {
        const { writePng } = await import("./output/png.ts");
        await writePng(output.path, svgContent);
      } else {
        const { writeSvg } = await import("./output/svg.ts");
        await writeSvg(output.path, svgContent);
      }
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
