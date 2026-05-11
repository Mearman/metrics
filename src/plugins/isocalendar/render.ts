/**
 * Isocalendar plugin — renderer.
 *
 * Renders a contribution heatmap calendar grid.
 */

import { rect, text } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { IsocalendarData } from "./source.ts";

/**
 * Render the isocalendar contribution heatmap.
 */
export function renderIsocalendar(
  data: IsocalendarData,
  _config: { duration?: string },
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const cellSize = 10;
  const cellGap = 2;
  const cellStep = cellSize + cellGap;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Title
  const titleY = 14;
  elements.push(
    text(
      padding,
      titleY,
      `${String(data.totalContributions)} contributions in the last year`,
      {
        fill: colours.text,
        "font-size": 14,
        "font-weight": 600,
        "font-family": fontStack,
      },
    ),
  );

  // Calendar grid
  const gridY = titleY + 12;

  for (const week of data.weeks) {
    const weekIndex = data.weeks.indexOf(week);
    const x = padding + weekIndex * cellStep;

    for (const day of week.contributionDays) {
      const dayIndex = week.contributionDays.indexOf(day);
      const y = gridY + dayIndex * cellStep;

      elements.push(
        rect(x, y, cellSize, cellSize, {
          fill: day.count === 0 ? colours.calendar.L0 : day.colour,
          rx: 2,
        }),
      );
    }
  }

  const gridHeight = 7 * cellStep;
  const totalHeight = gridY + gridHeight + padding;

  return { height: totalHeight, elements };
}
