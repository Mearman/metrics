/**
 * Isocalendar plugin — renderer.
 *
 * Renders a contribution heatmap calendar grid.
 * Cell size is computed to fit within the available content width.
 */

import { rect, g } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { IsocalendarData } from "./source.ts";
import { sectionHeader } from "../../render/svg/header.ts";

/**
 * Render the isocalendar contribution heatmap.
 */
export function renderIsocalendar(
  data: IsocalendarData,
  config: { duration?: string },
  ctx: RenderContext,
): RenderResult {
  const { colours, sectionPadding: padding } = ctx.theme;

  const weeks = data.weeks.length;
  const rows = 7;
  const cellGap = 2;

  // Compute cell size to fit all weeks within content width
  const availableWidth = ctx.contentWidth - (weeks - 1) * cellGap;
  const cellSize = Math.max(Math.floor(availableWidth / weeks), 2);
  const cellStep = cellSize + cellGap;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems, contentY } = sectionHeader(
    `${String(data.totalContributions)} contributions in the last year`,
    ctx,
    { pluginId: "isocalendar" },
  );
  elements.push(...headerElems);

  // Calendar grid — wrap cells in a group
  const gridY = contentY + 4;
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
