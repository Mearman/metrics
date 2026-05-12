/**
 * Reactions plugin — renderer.
 *
 * Renders reaction statistics as emoji-labelled bars.
 * Supports absolute/relative display and count/percentage details.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { ReactionsData } from "./source.ts";

/** Map reaction keys to display emoji */
const REACTION_EMOJI: Record<string, string> = {
  "+1": "👍",
  "-1": "👎",
  laugh: "😄",
  hooray: "🎉",
  confused: "😕",
  heart: "❤️",
  rocket: "🚀",
  eyes: "👀",
};

const REACTION_ORDER = [
  "heart",
  "+1",
  "rocket",
  "eyes",
  "laugh",
  "hooray",
  "-1",
  "confused",
];

/**
 * Render reaction statistics.
 */
export function renderReactions(
  data: ReactionsData,
  config: {
    display?: string;
    details?: string[];
  },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const isRelative = config.display === "relative";
  const details = config.details ?? [];
  const showCount = details.includes("count");
  const showPct = details.includes("percentage");

  elements.push(
    text(padding, 14, "Reactions", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  if (data.items.length === 0) {
    elements.push(
      text(
        padding,
        34,
        `No reactions in scanned items (${String(data.scanned)} scanned)`,
        {
          fill: colours.textTertiary,
          "font-size": 12,
          "font-family": fontStack,
        },
      ),
    );
    return { height: 50, elements };
  }

  // Determine scale: absolute (total) or relative (highest = max)
  const totalReactions = Object.values(data.totals).reduce(
    (sum, v) => sum + v,
    0,
  );
  const maxCount = Math.max(
    ...REACTION_ORDER.map((key) => data.totals[key] ?? 0),
    1,
  );

  let y = 32;
  const labelWidth = 110;
  const barMaxWidth = ctx.contentWidth - labelWidth - 60;

  for (const key of REACTION_ORDER) {
    const count = data.totals[key] ?? 0;
    if (count === 0) continue;

    const emoji = REACTION_EMOJI[key] ?? key;

    // Compute bar scale
    const scaledCount = isRelative
      ? (count / maxCount) * barMaxWidth
      : totalReactions > 0
        ? (count / totalReactions) * barMaxWidth
        : 0;
    const barWidth = Math.max(scaledCount, 4);

    // Label with optional details
    let label = emoji;
    if (showCount) label += ` ${String(count)}`;
    if (showPct) {
      const pct =
        totalReactions > 0 ? ((count / totalReactions) * 100).toFixed(1) : "0";
      label += ` ${pct}%`;
    }
    if (!showCount && !showPct) label += ` ${String(count)}`;

    elements.push(
      text(padding, y + 12, label, {
        fill: colours.textSecondary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );

    elements.push(
      rect(padding + labelWidth, y + 4, barWidth, 10, {
        fill: colours.accent,
        opacity: 0.7,
        rx: 3,
      }),
    );

    y += 20;
  }

  // Top reacted items
  y += 8;
  elements.push(
    text(padding, y, "Most reacted", {
      fill: colours.textTertiary,
      "font-size": 10,
      "font-family": fontStack,
    }),
  );
  y += 14;

  for (const item of data.items.slice(0, 3)) {
    const label = `${item.type}: ${item.title}`;
    const maxLabelWidth = ctx.contentWidth - 50;
    const truncated = truncateText(label, maxLabelWidth, 11, ctx.measure);

    elements.push(
      text(padding + 8, y + 10, truncated, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    elements.push(
      text(
        ctx.contentWidth + padding - 30,
        y + 10,
        String(item.reactions.total_count),
        {
          fill: colours.textTertiary,
          "font-size": 11,
          "font-family": fontStack,
        },
      ),
    );

    y += 16;
  }

  return { height: y + padding, elements };
}
