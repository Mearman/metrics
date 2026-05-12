/**
 * Sponsors plugin — renderer.
 *
 * Renders sponsor avatar grid with optional goal and about text.
 */

import { text, rect, image, g } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { SponsorsData } from "./source.ts";

export function renderSponsors(
  data: SponsorsData,
  config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  const resolvedSections = Array.isArray(config.sections)
    ? config.sections
    : ["goal", "list"];
  const resolvedSize = typeof config.size === "number" ? config.size : 28;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (
    data.sponsors.length === 0 &&
    data.about.length === 0 &&
    data.goal === null
  ) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Sponsors", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let y = 28;

  // Goal progress bar
  if (data.goal !== null && resolvedSections.includes("goal")) {
    const goal = data.goal;
    elements.push(
      text(
        padding,
        y + 10,
        truncateText(goal.title, ctx.contentWidth, 11, ctx.measure),
        {
          fill: colours.textSecondary,
          "font-size": 11,
          "font-family": fontStack,
        },
      ),
    );
    y += 16;

    const barWidth = ctx.contentWidth;
    elements.push(
      rect(padding, y, barWidth, 6, { fill: colours.border, rx: 3 }),
    );
    const filledWidth = barWidth * (goal.percentComplete / 100);
    elements.push(
      rect(padding, y, filledWidth, 6, { fill: colours.success, rx: 3 }),
    );
    y += 10;

    elements.push(
      text(padding, y + 10, `${String(goal.percentComplete)}%`, {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );
    y += 18;
  }

  // About text
  if (data.about.length > 0 && resolvedSections.includes("about")) {
    const about = truncateText(data.about, ctx.contentWidth, 11, ctx.measure);
    elements.push(
      text(padding, y + 10, about, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );
    y += 18;
  }

  // Sponsor avatar grid
  if (resolvedSections.includes("list") && data.sponsors.length > 0) {
    const gap = 4;
    const cols = Math.floor(ctx.contentWidth / (resolvedSize + gap));

    const avatarElements: import("../../render/svg/builder.ts").SvgElement[] =
      [];
    let i = 0;
    for (const sponsor of data.sponsors) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      avatarElements.push(
        image(
          col * (resolvedSize + gap),
          row * (resolvedSize + gap),
          resolvedSize,
          resolvedSize,
          sponsor.avatarUrl,
        ),
      );
      i++;
    }

    const rows = Math.ceil(data.sponsors.length / cols);
    y += 4;
    elements.push(
      g(
        { transform: `translate(${String(padding)},${String(y)})` },
        ...avatarElements,
      ),
    );
    y += rows * (resolvedSize + gap) + 4;
  }

  return { height: y + padding, elements };
}
