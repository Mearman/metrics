/**
 * Discussions plugin — renderer.
 *
 * Renders discussion statistics with category breakdown.
 */

import * as z from "zod";
import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { DiscussionsConfig } from "./source.ts";
import type { DiscussionsData } from "./source.ts";

/**
 * Render discussion statistics.
 */
export function renderDiscussions(
  data: DiscussionsData,
  config: z.input<typeof DiscussionsConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  if (data.totalCount === 0) {
    return { height: 0, elements: [] };
  }

  elements.push(
    text(padding, 14, `💬 ${String(data.totalCount)} discussions`, {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  if (data.categories.length === 0) {
    return { height: 30 + padding, elements };
  }

  const yStart = 32;
  const barHeight = 10;
  const barGap = 14;
  const maxCount = Math.max(
    ...data.categories.map((c) => c.discussionCount),
    1,
  );
  const labelWidth = 100;
  const barMaxWidth = ctx.contentWidth - labelWidth - 50;

  const row = 0;
  for (const cat of data.categories) {
    const y = yStart + row * (barHeight + barGap);

    // Category name
    elements.push(
      text(padding, y + barHeight - 1, cat.name, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    // Bar
    const barWidth = (cat.discussionCount / maxCount) * barMaxWidth;
    elements.push(
      rect(padding + labelWidth, y, Math.max(barWidth, 1), barHeight, {
        fill: colours.accent,
        rx: 3,
        opacity: 0.7,
      }),
    );

    // Count
    elements.push(
      text(
        padding + labelWidth + barWidth + 6,
        y + barHeight - 1,
        String(cat.discussionCount),
        {
          fill: colours.textTertiary,
          "font-size": 10,
          "font-family": fontStack,
        },
      ),
    );
  }

  const totalHeight =
    yStart + data.categories.length * (barHeight + barGap) + padding;

  return { height: totalHeight, elements };
}
