import * as z from "zod";
/**
 * Topics plugin — renderer.
 *
 * Renders topic tags as styled pills/badges, sized by frequency.
 */

import { text, rect, g } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { TopicsConfig } from "./source.ts";
import type { TopicsData } from "./source.ts";

/**
 * Render topics as pill badges.
 */
export function renderTopics(
  data: TopicsData,
  config: z.input<typeof TopicsConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.topics.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Topics", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  // Pill layout
  const fontSize = 11;
  const pillPaddingH = 8;
  const pillPaddingV = 4;
  const pillHeight = fontSize + pillPaddingV * 2;
  const pillGap = 6;
  const lineGap = 4;

  const pillElements: import("../../render/svg/builder.ts").SvgElement[] = [];
  let x = 0;
  let y = 0;

  for (const topic of data.topics) {
    const label = truncateText(
      topic.name,
      ctx.contentWidth / 2,
      fontSize,
      ctx.measure,
    );
    const labelWidth =
      ctx.measure.textWidth(label, fontSize) + pillPaddingH * 2;

    // Wrap to next line if this pill overflows
    if (x + labelWidth > ctx.contentWidth && x > 0) {
      x = 0;
      y += pillHeight + lineGap;
    }

    // Pill background
    pillElements.push(
      rect(x, y, labelWidth, pillHeight, {
        fill: colours.border,
        rx: pillHeight / 2,
      }),
    );

    // Pill text
    pillElements.push(
      text(x + pillPaddingH, y + pillPaddingV + fontSize - 2, label, {
        fill: colours.textSecondary,
        "font-size": fontSize,
        "font-family": fontStack,
      }),
    );

    x += labelWidth + pillGap;
  }

  elements.push(
    g({ transform: `translate(${String(padding)},24)` }, ...pillElements),
  );

  const totalHeight = 24 + y + pillHeight + padding;

  return { height: totalHeight, elements };
}
