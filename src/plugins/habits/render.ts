/**
 * Habits plugin — renderer.
 *
 * Renders commit habits with summary stats, optional hour-of-day and
 * day-of-week charts, and "mildly interesting facts".
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { HabitsData, WeekdayActivity } from "./source.ts";

// ---------------------------------------------------------------------------
// Chart helpers
// ---------------------------------------------------------------------------

/** Render a mini bar chart and return the final Y position. */
function renderBarChart(
  elements: import("../../render/svg/builder.ts").SvgElement[],
  items: { label: string; count: number }[],
  x: number,
  y: number,
  width: number,
  height: number,
  colour: string,
  labelColour: string,
  fontStack: string,
  trim: boolean,
): number {
  // Trim leading/trailing zero items
  let slice = items;
  if (trim) {
    let start = 0;
    let end = items.length;
    while (start < end && items[start]?.count === 0) start++;
    while (end > start && items[end - 1]?.count === 0) end--;
    slice = items.slice(start, end);
  }

  if (slice.length === 0) return y;

  const maxCount = Math.max(...slice.map((i) => i.count), 1);
  const barWidth = Math.max(width / slice.length - 2, 2);

  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    if (item === undefined) continue;
    const barHeight = (item.count / maxCount) * height;
    const barX = x + i * (barWidth + 2);

    elements.push(
      rect(barX, y + height - barHeight, barWidth, barHeight, {
        fill: item.count > 0 ? colour : "#21262d",
        rx: 1,
      }),
    );

    // Label (every Nth item to avoid crowding)
    const labelInterval = Math.ceil(slice.length / 8);
    if (i % labelInterval === 0) {
      elements.push(
        text(barX, y + height + 12, item.label, {
          fill: labelColour,
          "font-size": 8,
          "font-family": fontStack,
        }),
      );
    }
  }

  return y + height + 18;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function renderHabits(
  data: HabitsData,
  config: {
    charts?: boolean;
    facts?: boolean;
    trim?: boolean;
  },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const showCharts = config.charts ?? false;
  const showFacts = config.facts ?? true;

  // Title
  const titleY = 14;
  elements.push(
    text(padding, titleY, "Commit habits", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let y = titleY + 24;

  // Facts section — "mildly interesting facts"
  if (showFacts) {
    for (const fact of data.facts) {
      elements.push(
        text(padding + 8, y, `${fact.label}:`, {
          fill: colours.textTertiary,
          "font-size": 11,
          "font-family": fontStack,
        }),
      );
      const labelWidth = ctx.measure.textWidth(`${fact.label}: `, 11);
      elements.push(
        text(padding + 8 + labelWidth, y, fact.value, {
          fill: colours.textSecondary,
          "font-size": 11,
          "font-weight": 600,
          "font-family": fontStack,
        }),
      );
      y += 16;
    }
    y += 4;
  }

  // Charts
  if (showCharts) {
    // Day-of-week chart
    const dayLabels: { label: string; count: number }[] = data.weekdays.map(
      (wd: WeekdayActivity) => ({
        label: wd.day.slice(0, 2),
        count: wd.count,
      }),
    );

    elements.push(
      text(padding, y, "Activity per day of week", {
        fill: colours.textSecondary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );
    y += 14;

    y = renderBarChart(
      elements,
      dayLabels,
      padding,
      y,
      contentWidth,
      32,
      colours.accent,
      colours.textTertiary,
      fontStack,
      false,
    );

    // Activity timeline (per day over the period)
    elements.push(
      text(padding, y, "Activity over time", {
        fill: colours.textSecondary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );
    y += 14;

    const dayItems = data.days.map((d) => ({
      label: "",
      count: d.count,
    }));

    y = renderBarChart(
      elements,
      dayItems,
      padding,
      y,
      contentWidth,
      32,
      colours.accent,
      colours.textTertiary,
      fontStack,
      config.trim ?? false,
    );
  }

  const totalHeight = y + padding - titleY;

  return { height: totalHeight, elements };
}
