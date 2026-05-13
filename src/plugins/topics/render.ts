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
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

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
    return emptySection("Topics", "No repository topics found", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems, contentY } = sectionHeader("Topics", ctx, {
    pluginId: "topics",
  });
  elements.push(...headerElems);

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
    g(
      { transform: `translate(${String(padding)},${String(contentY + 10)})` },
      ...pillElements,
    ),
  );

  const totalHeight = contentY + 10 + y + pillHeight + padding;

  return { height: totalHeight, elements };
}
