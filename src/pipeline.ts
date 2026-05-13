/**
 * Pipeline orchestrator — config → fetch → render → write.
 *
 * This is the core of the metrics generator. It:
 * 1. Loads config via cosmiconfig
 * 2. Creates an authenticated API client
 * 3. For each output, fetches plugin data (cached across outputs), renders SVG, writes file
 */

import type { RootConfig } from "./config/schema.ts";
import { createClient } from "./api/client.ts";
import { serialise } from "./render/svg/serialise.ts";
import { svg, rect, line, g } from "./render/svg/builder.ts";
import { getPlugin } from "./plugins/registry.ts";
import { getMockData } from "./plugins/mock-registry.ts";
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
// Colour override merging
// ---------------------------------------------------------------------------

/** Apply colour overrides onto a resolved theme. */
function applyColourOverrides(
  theme: ReturnType<typeof resolveTheme>,
  overrides: NonNullable<RootConfig["colours"]>,
): void {
  const calOverrides = overrides.calendar;
  if (calOverrides !== undefined) {
    const merged = { ...theme.colours.calendar };
    if (calOverrides.L0 !== undefined) merged.L0 = calOverrides.L0;
    if (calOverrides.L1 !== undefined) merged.L1 = calOverrides.L1;
    if (calOverrides.L2 !== undefined) merged.L2 = calOverrides.L2;
    if (calOverrides.L3 !== undefined) merged.L3 = calOverrides.L3;
    if (calOverrides.L4 !== undefined) merged.L4 = calOverrides.L4;
    theme.colours.calendar = merged;
  }
  if (overrides.text !== undefined) theme.colours.text = overrides.text;
  if (overrides.textSecondary !== undefined)
    theme.colours.textSecondary = overrides.textSecondary;
  if (overrides.textTertiary !== undefined)
    theme.colours.textTertiary = overrides.textTertiary;
  if (overrides.accent !== undefined) theme.colours.accent = overrides.accent;
  if (overrides.background !== undefined)
    theme.colours.background = overrides.background;
  if (overrides.border !== undefined) theme.colours.border = overrides.border;
  if (overrides.error !== undefined) theme.colours.error = overrides.error;
  if (overrides.warning !== undefined)
    theme.colours.warning = overrides.warning;
  if (overrides.success !== undefined)
    theme.colours.success = overrides.success;
}

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

/** Cache key for plugin data: plugin ID + serialised config. */
function cacheKey(pluginId: string, config: unknown): string {
  return `${pluginId}:${JSON.stringify(config)}`;
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

  // Plugin data cache — shared across outputs so that the same plugin
  // with the same config is only fetched once per pipeline run.
  const dataCache = new Map<string, unknown>();

  for (const output of config.outputs) {
    // Resolve theme: per-output override → root template
    const template = output.template ?? config.template;
    const theme = resolveTheme(template);

    // Apply colour overrides: root first, then per-output on top
    if (config.colours) {
      applyColourOverrides(theme, config.colours);
    }
    if (output.colours) {
      applyColourOverrides(theme, output.colours);
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
      const parsedConfig = plugin.configSchema.safeParse(pluginConfig);
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

      // Fetch data — use mock if requested, otherwise use cache or API
      const mockList = output.mock ?? [];
      let useMock = mockList.includes(pluginId);
      const mockFallbackSetting = output.mock_fallback ?? config.mock_fallback;
      const mockFallbackEnabled =
        mockFallbackSetting === true ||
        (Array.isArray(mockFallbackSetting) &&
          mockFallbackSetting.includes(pluginId));
      let data: unknown;

      if (useMock) {
        // Custom mock data takes precedence over registry defaults
        data = output.mock_data?.[pluginId] ?? getMockData(pluginId);
        if (data === undefined) {
          console.warn(
            `Plugin "${pluginId}" has no mock data — fetching normally`,
          );
          useMock = false;
        }
      }
      if (!useMock) {
        const key =
          plugin.computeFetchKey !== undefined
            ? `${pluginId}:${JSON.stringify(plugin.computeFetchKey(resolvedConfig))}`
            : cacheKey(pluginId, resolvedConfig);
        data = dataCache.get(key);

        if (data === undefined) {
          try {
            data = await plugin.fetch(
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
            dataCache.set(key, data);
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error);
            console.warn(
              `Plugin "${pluginId}" fetch failed: ${message} — skipping`,
            );
            continue;
          }
        }

        // Mock fallback: if fetched data is empty, substitute mock data
        if (
          mockFallbackEnabled &&
          data !== undefined &&
          plugin.isEmpty?.(data) === true
        ) {
          const fallback =
            output.mock_data?.[pluginId] ?? getMockData(pluginId);
          if (fallback !== undefined) {
            console.log(
              `Plugin "${pluginId}" data is empty — using mock fallback`,
            );
            data = fallback;
          }
        }
      }

      // Render (always re-render — theme/colours may differ per output)
      const result = plugin.render(data, resolvedConfig, {
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
