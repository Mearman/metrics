/**
 * RSS plugin — renderer.
 *
 * Displays a list of RSS feed items with titles and relative dates.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { RssData } from "./source.ts";
import { sectionHeader } from "../../render/svg/header.ts";

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/** Format a date as a relative time string (e.g. "3 days ago"). */
function relativeDate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${String(years)}y ago`;
  if (months > 0) return `${String(months)}mo ago`;
  if (weeks > 0) return `${String(weeks)}w ago`;
  if (days > 0) return `${String(days)}d ago`;
  if (hours > 0) return `${String(hours)}h ago`;
  if (minutes > 0) return `${String(minutes)}m ago`;
  return "just now";
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

const ROW_START_Y = 32;
const ROW_HEIGHT = 22;
const DOT_SIZE = 6;

export function renderRss(
  data: RssData,
  config: { limit?: number },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Title — feed name + "RSS feed"
  // Header with icon
  const { elements: headerElems } = sectionHeader(
    `${data.feedTitle} RSS feed`,
    ctx,
    {
      pluginId: "rss",
    },
  );
  elements.push(...headerElems);

  if (data.items.length === 0) {
    elements.push(
      text(padding, ROW_START_Y, "Empty RSS feed", {
        fill: colours.textSecondary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );
    return { height: ROW_START_Y + padding, elements };
  }

  // Items
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    if (item === undefined) continue;
    const y = ROW_START_Y + i * ROW_HEIGHT;

    // Dot indicator
    elements.push(
      rect(padding, y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE, {
        fill: colours.accent,
        rx: 1,
      }),
    );

    // Title
    const titleX = padding + DOT_SIZE + 8;
    const maxTitleWidth = ctx.contentWidth - titleX - padding;
    const truncated = truncateText(item.title, maxTitleWidth, 12, ctx.measure);
    elements.push(
      text(titleX, y + 4, truncated, {
        fill: colours.text,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );

    // Date — right-aligned
    const dateStr = relativeDate(item.date);
    const dateWidth = ctx.measure.textWidth(dateStr, 10);
    elements.push(
      text(ctx.contentWidth - dateWidth, y + 4, dateStr, {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );
  }

  const totalHeight = ROW_START_Y + data.items.length * ROW_HEIGHT + padding;
  return { height: totalHeight, elements };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateText(
  content: string,
  maxWidth: number,
  fontSize: number,
  measure: { textWidth: (text: string, size: number) => number },
): string {
  if (measure.textWidth(content, fontSize) <= maxWidth) return content;
  let truncated = content;
  while (
    truncated.length > 0 &&
    measure.textWidth(truncated + "…", fontSize) > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}
