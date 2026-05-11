/**
 * Isocalendar plugin — renderer.
 *
 * Renders a contribution heatmap calendar grid.
 * Cell size is computed to fit within the available content width.
 */

import { rect, text, g } from "../../render/svg/builder.ts";
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

  const weeks = data.weeks.length;
  const rows = 7;
  const cellGap = 2;

  // Compute cell size to fit all weeks within content width
  const availableWidth = ctx.contentWidth - (weeks - 1) * cellGap;
  const cellSize = Math.max(Math.floor(availableWidth / weeks), 2);
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

  // Calendar grid — wrap cells in a group
  const gridY = titleY + 12;
  const cells: import("../../render/svg/builder.ts").SvgElement[] = [];

  for (let weekIndex = 0; weekIndex < data.weeks.length; weekIndex++) {
    const week = data.weeks[weekIndex];
    if (week === undefined) continue;
    const x = weekIndex * cellStep;

    for (
      let dayIndex = 0;
      dayIndex < week.contributionDays.length;
      dayIndex++
    ) {
      const day = week.contributionDays[dayIndex];
      if (day === undefined) continue;
      const y = gridY + dayIndex * cellStep;

      cells.push(
        rect(x, y, cellSize, cellSize, {
          fill: day.count === 0 ? colours.calendar.L0 : day.colour,
          rx: 1,
        }),
      );
    }
  }

  elements.push(g({ transform: `translate(${String(padding)},0)` }, ...cells));

  const gridHeight = rows * cellStep;
  const totalHeight = gridY + gridHeight + padding;

  return { height: totalHeight, elements };
}
