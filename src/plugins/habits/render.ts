/**
 * Habits plugin — renderer.
 *
 * Renders commit timing habits as a summary with optional chart.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { HabitsData } from "./source.ts";

/** Format a date string to short form. */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Render the habits section.
 */
export function renderHabits(
  data: HabitsData,
  config: { charts?: boolean; facts?: boolean },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

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

  // Summary stats
  const stats = [
    `${String(data.totalCommits)} commits in period`,
    `Busiest day: ${formatDate(data.busiestDay)} (${String(data.busiestDayCount)} commits)`,
    `Average: ${data.avgPerDay.toFixed(1)} commits/day`,
    `Current streak: ${String(data.streak)} days`,
  ];

  for (const stat of stats) {
    elements.push(
      text(padding + 8, y, stat, {
        fill: colours.textSecondary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );
    y += 18;
  }

  // Activity bar chart
  if (config.charts) {
    y += 8;
    const maxCount = Math.max(...data.days.map((d) => d.count), 1);
    const barHeight = 40;
    const barWidth = Math.max(contentWidth / data.days.length - 2, 2);

    for (let i = 0; i < data.days.length; i++) {
      const day = data.days[i];
      if (day === undefined) continue;
      const height = (day.count / maxCount) * barHeight;
      const x = padding + i * (barWidth + 2);

      elements.push(
        rect(x, y + barHeight - height, barWidth, height, {
          fill: day.count > 0 ? colours.accent : colours.border,
          rx: 1,
        }),
      );
    }

    y += barHeight + 8;
  }

  const totalHeight = y + padding - titleY;

  return { height: totalHeight, elements };
}
