/**
 * Stargazers plugin — renderer.
 *
 * Renders a horizontal bar chart of star counts per repo.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { StargazersData } from "./source.ts";

/**
 * Render stargazer breakdown as a horizontal bar chart.
 */
export function renderStargazers(
  data: StargazersData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.repos.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const maxStars = Math.max(...data.repos.map((r) => r.stars), 1);

  elements.push(
    text(padding, 14, `⭐ ${String(data.totalStars)} total stars`, {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  const startY = 32;
  const barHeight = 12;
  const barGap = 6;
  const labelWidth = 120;
  const barMaxWidth = ctx.contentWidth - labelWidth - 8;

  let row = 0;
  for (const repo of data.repos) {
    const y = startY + row * (barHeight + barGap);

    // Repo name (left)
    elements.push(
      text(padding, y + barHeight - 2, repo.name, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    // Bar
    const barWidth = maxStars > 0 ? (repo.stars / maxStars) * barMaxWidth : 0;
    elements.push(
      rect(padding + labelWidth, y, Math.max(barWidth, 1), barHeight, {
        fill: "#e3b341",
        rx: 3,
        opacity: 0.7,
      }),
    );

    // Star count
    elements.push(
      text(
        padding + labelWidth + barWidth + 6,
        y + barHeight - 2,
        String(repo.stars),
        {
          fill: colours.textTertiary,
          "font-size": 10,
          "font-family": fontStack,
        },
      ),
    );

    row++;
  }

  const totalHeight =
    startY + data.repos.length * (barHeight + barGap) + padding;

  return { height: totalHeight, elements };
}
