/**
 * Languages plugin — renderer.
 *
 * Renders a horizontal bar chart of language breakdown with legend.
 * Supports: ignored, other grouping, custom colours, aliases, details.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { LanguagesData, LanguageEntry } from "./source.ts";

/** Format byte count as human-readable (e.g. "1.2 MB"). */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Apply config transforms: ignored, aliases, colours, other grouping.
 */
function transformLanguages(
  data: LanguagesData,
  config: {
    limit?: number;
    threshold?: number;
    ignored?: string[];
    other?: boolean;
    colors?: Record<string, string>;
    aliases?: Record<string, string>;
  },
): { languages: LanguageEntry[]; totalBytes: number; otherBytes: number } {
  const ignoredSet = new Set(
    (config.ignored ?? []).map((l) => l.toLowerCase()),
  );
  const colours = config.colors ?? {};
  const aliases = config.aliases ?? {};
  const threshold = config.threshold ?? 1;
  const limit = config.limit ?? 8;

  // Apply aliases and colours, filter ignored
  const filtered = data.total
    .filter((lang) => !ignoredSet.has(lang.name.toLowerCase()))
    .map((lang) => {
      const key = lang.name.toLowerCase();
      return {
        name: aliases[key] ?? lang.name,
        colour: colours[key] ?? lang.colour,
        size: lang.size,
      };
    });

  const totalBytes = filtered.reduce((sum, lang) => sum + lang.size, 0);

  // Filter by threshold percentage
  const aboveThreshold = filtered.filter((lang) => {
    const pct = (lang.size / totalBytes) * 100;
    return pct >= threshold;
  });

  // Apply limit
  const limited = aboveThreshold.slice(0, limit);

  // Group the rest into "Other" if requested
  let otherBytes = 0;
  if (config.other === true) {
    const limitedNames = new Set(limited.map((l) => l.name));
    for (const lang of filtered) {
      if (!limitedNames.has(lang.name)) {
        otherBytes += lang.size;
      }
    }
    if (otherBytes > 0) {
      limited.push({
        name: "Other",
        colour: "#8b949e",
        size: otherBytes,
      });
    }
  }

  return { languages: limited, totalBytes, otherBytes };
}

export function renderLanguages(
  data: LanguagesData,
  config: {
    limit?: number;
    threshold?: number;
    ignored?: string[];
    other?: boolean;
    colors?: Record<string, string>;
    aliases?: Record<string, string>;
    details?: string[];
  },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;
  const details = config.details ?? [];

  const { languages, totalBytes } = transformLanguages(data, config);

  if (languages.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Section title
  const titleY = 0;
  elements.push(
    text(padding, titleY + 14, "Languages", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  // Stacked bar
  const barY = titleY + 28;
  const barHeight = 8;
  let xOffset = padding;

  for (const lang of languages) {
    const pct = lang.size / totalBytes;
    const barWidth = Math.max(pct * contentWidth, 2);
    elements.push(
      rect(xOffset, barY, barWidth, barHeight, {
        fill: lang.colour,
      }),
    );
    xOffset += barWidth;
  }

  // Legend — two columns with details
  const legendY = barY + barHeight + 16;
  const lineHeight = 20;
  const dotSize = 10;
  const columnWidth = contentWidth / 2;
  const legendFontSize = 11;
  const showBytes = details.includes("bytes-size");
  const showPct = details.includes("percentage");

  let y = legendY;
  let column = 0;

  for (const lang of languages) {
    const x = padding + column * columnWidth;
    const textBaseline = y + dotSize / 2 + legendFontSize / 3;

    // Colour dot
    elements.push(
      rect(x, y, dotSize, dotSize, {
        fill: lang.colour,
        rx: 2,
      }),
    );

    // Label
    const pct = ((lang.size / totalBytes) * 100).toFixed(1);
    let label = lang.name;
    if (showPct) label += ` ${pct}%`;
    if (showBytes) label += ` (${formatBytes(lang.size)})`;

    const maxLabelWidth = columnWidth - dotSize - 10;
    const truncated = truncateText(
      label,
      maxLabelWidth,
      legendFontSize,
      ctx.measure,
    );

    elements.push(
      text(x + dotSize + 6, textBaseline, truncated, {
        fill: colours.textSecondary,
        "font-size": legendFontSize,
        "font-family": fontStack,
      }),
    );

    // Move to next row, wrap to second column at halfway point
    if (column === 0 && languages.length > 4) {
      column = 1;
    } else {
      column = 0;
      y += lineHeight;
    }
  }

  const totalHeight =
    (column === 0 ? y : y + lineHeight) +
    padding -
    legendY +
    barY +
    barHeight +
    16;

  return { height: totalHeight, elements };
}
