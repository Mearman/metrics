import * as z from "zod";
/**
 * Calendar plugin — renderer.
 *
 * Renders yearly contribution calendars as compact grids.
 */

import { text, rect, g } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { CalendarConfig } from "./source.ts";
import type { CalendarData } from "./source.ts";

/**
 * Render contribution calendars per year.
 */
export function renderCalendar(
  data: CalendarData,
  config: z.input<typeof CalendarConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.years.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const cellSize = 3;
  const cellGap = 1;
  const cellStep = cellSize + cellGap;

  let yCursor = 0;

  for (const year of data.years) {
    // Year label
    elements.push(
      text(
        padding,
        yCursor + 12,
        `${String(year.year)} (${String(year.contributionDays.length)} days)`,
        {
          fill: colours.text,
          "font-size": 12,
          "font-weight": 600,
          "font-family": fontStack,
        },
      ),
    );
    yCursor += 20;

    // Calendar grid — 53 weeks × 7 days
    const cells: import("../../render/svg/builder.ts").SvgElement[] = [];

    let weekIndex = 0;
    for (const week of chunkWeeks(year.contributionDays)) {
      let dayIndex = 0;
      for (const day of week) {
        if (day !== undefined) {
          cells.push(
            rect(
              weekIndex * cellStep,
              dayIndex * cellStep,
              cellSize,
              cellSize,
              {
                fill:
                  day.contributionCount === 0
                    ? colours.calendar.L0
                    : day.colour,
                rx: 1,
              },
            ),
          );
        }
        dayIndex++;
      }
      weekIndex++;
    }

    elements.push(
      g(
        { transform: `translate(${String(padding)},${String(yCursor)})` },
        ...cells,
      ),
    );

    const gridHeight = 7 * cellStep;
    yCursor += gridHeight + 12;
  }

  return { height: yCursor + padding, elements };
}

/**
 * Chunk days into weeks (7-day groups).
 */
function chunkWeeks(
  days: { date: string; contributionCount: number; colour: string }[],
): (
  | { date: string; contributionCount: number; colour: string }
  | undefined
)[][] {
  const weeks: (
    | { date: string; contributionCount: number; colour: string }
    | undefined
  )[][] = [];

  // Days are already grouped by week from GraphQL
  let currentWeek: (
    | { date: string; contributionCount: number; colour: string }
    | undefined
  )[] = [];

  for (const day of days) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
