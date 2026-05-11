/**
 * Languages plugin — renderer.
 *
 * Renders a horizontal bar chart of language breakdown.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { LanguagesData } from "./source.ts";

export function renderLanguages(
  data: LanguagesData,
  config: { limit?: number; threshold?: number },
  ctx: RenderContext,
): RenderResult {
  const limit = config.limit ?? 8;
  const threshold = config.threshold ?? 5;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;

  // Filter by threshold percentage, take top N
  const filtered = data.total.filter((lang) => {
    const pct = (lang.size / data.totalBytes) * 100;
    return pct >= threshold;
  });
  const languages = filtered.slice(0, limit);

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
    const pct = lang.size / data.totalBytes;
    const barWidth = Math.max(pct * contentWidth, 2);
    elements.push(
      rect(xOffset, barY, barWidth, barHeight, {
        fill: lang.colour,
      }),
    );
    xOffset += barWidth;
  }

  // Legend — two columns
  const legendY = barY + barHeight + 16;
  const lineHeight = 20;
  const dotSize = 10;
  const columnWidth = contentWidth / 2;

  let y = legendY;
  let column = 0;

  for (const lang of languages) {
    const x = padding + column * columnWidth;

    // Colour dot
    elements.push(
      rect(x, y + 4, dotSize, dotSize, {
        fill: lang.colour,
        rx: 2,
      }),
    );

    // Label + percentage
    const pct = ((lang.size / data.totalBytes) * 100).toFixed(1);
    const label = `${lang.name} ${pct}%`;
    elements.push(
      text(x + dotSize + 6, y + 13, label, {
        fill: colours.textSecondary,
        "font-size": 11,
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
