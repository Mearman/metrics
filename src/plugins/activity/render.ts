/**
 * Activity plugin — renderer.
 *
 * Renders recent activity as a timeline of events.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { ActivityData } from "./source.ts";

/** Event type to colour mapping. */
const EVENT_COLOURS: Record<string, string> = {
  push: "#58a6ff",
  issue: "#3fb950",
  pr: "#a371f7",
  review: "#a371f7",
  comment: "#8b949e",
  release: "#f0883e",
  fork: "#58a6ff",
  star: "#e3b341",
  wiki: "#8b949e",
  "ref/create": "#3fb950",
  "ref/delete": "#f85149",
};

/**
 * Render activity events as a list.
 */
export function renderActivity(
  data: ActivityData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.events.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Section title
  const titleY = 14;
  elements.push(
    text(padding, titleY, "Recent activity", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let yCursor = titleY + 16;

  for (const event of data.events) {
    const colour = EVENT_COLOURS[event.type] ?? colours.textSecondary;

    // Timeline dot
    elements.push(
      rect(padding + 2, yCursor + 2, 6, 6, { fill: colour, rx: 3 }),
    );

    // Event description
    const descX = padding + 18;
    elements.push(
      text(descX, yCursor + 8, event.description, {
        fill: colours.textSecondary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );

    // Repo name (right-aligned, truncated if too long)
    const maxRepoWidth = 180;
    const repoText = truncateText(event.repo, maxRepoWidth, 11, ctx.measure);
    const repoWidth = ctx.measure.textWidth(repoText, 11);
    elements.push(
      text(ctx.theme.width - padding - repoWidth, yCursor + 8, repoText, {
        fill: colours.textTertiary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    yCursor += 22;
  }

  return { height: yCursor + padding, elements };
}
