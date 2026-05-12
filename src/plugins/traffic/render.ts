/**
 * Traffic plugin — renderer.
 *
 * Renders repository view counts as a horizontal bar chart.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { TrafficData } from "./source.ts";

export function renderTraffic(
  data: TrafficData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.repos.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, `Traffic (${String(data.totalViews)} views)`, {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  const labelWidth = 160;
  const barMaxWidth = ctx.contentWidth - labelWidth - 50;
  const maxViews = Math.max(...data.repos.map((r) => r.views), 1);
  const barHeight = 12;
  const fontName = 11;
  const fontCount = 10;

  let y = 32;

  for (const repo of data.repos) {
    // Repo name
    const name = truncateText(repo.name, labelWidth - 8, fontName, ctx.measure);
    elements.push(
      text(padding, y + fontName, name, {
        fill: colours.textSecondary,
        "font-size": fontName,
        "font-family": fontStack,
      }),
    );

    // Bar
    const barWidth = (repo.views / maxViews) * barMaxWidth;
    elements.push(
      rect(padding + labelWidth, y, Math.max(barWidth, 1), barHeight, {
        fill: colours.accent,
        opacity: 0.7,
        rx: 3,
      }),
    );

    // Count
    const countText = `${String(repo.views)} (${String(repo.uniques)} unique)`;
    elements.push(
      text(padding + labelWidth + barWidth + 6, y + fontCount, countText, {
        fill: colours.textTertiary,
        "font-size": fontCount,
        "font-family": fontStack,
      }),
    );

    y += barHeight + 8;
  }

  return { height: y + padding, elements };
}
