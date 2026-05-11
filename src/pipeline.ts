/**
 * Pipeline orchestrator — config → fetch → render → write.
 *
 * This is the core of the metrics generator. It:
 * 1. Loads config via cosmiconfig
 * 2. Creates an authenticated API client
 * 3. For each output, fetches plugin data, renders SVG, writes file
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { RootConfig } from "./config/schema.ts";
import { createClient } from "./api/client.ts";
import { serialise } from "./render/svg/serialise.ts";
import { svg, rect } from "./render/svg/builder.ts";
import { getPlugin } from "./plugins/registry.ts";
import { registerAllPlugins } from "./plugins/register.ts";
import { createMeasure } from "./render/layout/measure.ts";
import { resolveTheme } from "./render/template/themes.ts";
import { createIconLookup } from "./render/svg/icons.ts";
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

      // Fetch data
      const data = await plugin.source.fetch(
        {
          api,
          user: username,
          signal: controller.signal,
        },
        pluginConfig,
      );

      // Render
      const result = plugin.renderer.render(data, pluginConfig, {
        measure,
        theme,
        icons,
        contentWidth,
      });

      renderResults.push(result);
    }

    // Layout: stack sections vertically
    const totalHeight = renderResults.reduce(
      (sum, r) => sum + r.height,
      theme.margin * 2,
    );

    const sections = renderResults.flatMap((result, index) => {
      const yOffset = renderResults
        .slice(0, index)
        .reduce((sum, r) => sum + r.height, theme.margin);

      // Offset each section's elements by its Y position in the stack
      return result.elements.map((element) =>
        offsetElement(element, 0, yOffset),
      );
    });

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
      // Background
      rect(0, 0, theme.width, totalHeight, {
        fill: theme.colours.background,
        rx: 6,
      }),
      ...sections,
    );

    const svgContent = serialise(root);

    if (!dryRun) {
      await mkdir(dirname(output.path), { recursive: true });
      await writeFile(output.path, svgContent, "utf-8");
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
 * Adds a `transform="translate(dx,dy)"` to the top-level element.
 */
function offsetElement(
  element: import("./render/svg/builder.ts").SvgElement,
  dx: number,
  dy: number,
): import("./render/svg/builder.ts").SvgElement {
  if (dx === 0 && dy === 0) return element;

  return {
    ...element,
    attrs: {
      ...element.attrs,
      transform: `translate(${String(dx)},${String(dy)})`,
    },
  };
}
