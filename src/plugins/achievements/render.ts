/**
 * Achievements plugin — renderer.
 *
 * Renders achievement badges with tier indicators.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { AchievementsData } from "./source.ts";
import { emptySection } from "../empty.ts";

const TIER_COLOURS: Record<string, string> = {
  X: "#ff6600",
  S: "#ff9900",
  A: "#58a6ff",
  B: "#3fb950",
  C: "#8b949e",
};

/**
 * Render the achievements section.
 */
export function renderAchievements(
  data: AchievementsData,
  config: {
    display?: string;
    threshold?: string;
    limit?: number;
    ignored?: string[];
  },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const threshold = config.threshold ?? "C";
  const tierOrder: Record<string, number> = { C: 0, B: 1, A: 2, S: 3, X: 4 };
  const minTier = tierOrder[threshold] ?? 0;
  const ignoredSet = new Set(config.ignored ?? []);

  let filtered = data.achievements
    .filter((a) => (tierOrder[a.tier] ?? 0) >= minTier)
    .filter((a) => !ignoredSet.has(a.id));

  // Apply limit (0 = all)
  const limit = config.limit ?? 0;
  if (limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  if (filtered.length === 0) {
    return emptySection("Achievements", "No achievements unlocked yet", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Title
  const titleY = 14;
  elements.push(
    text(padding, titleY, "Achievements", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let y = titleY + 20;

  for (const achievement of filtered) {
    const tierColour = TIER_COLOURS[achievement.tier] ?? colours.textTertiary;

    // Tier badge
    elements.push(
      rect(padding, y, 24, 18, {
        fill: tierColour,
        rx: 3,
      }),
    );
    elements.push(
      text(padding + 6, y + 14, achievement.tier, {
        fill: "#ffffff",
        "font-size": 11,
        "font-weight": 700,
        "font-family": fontStack,
      }),
    );

    // Title
    elements.push(
      text(padding + 32, y + 10, achievement.title, {
        fill: colours.text,
        "font-size": 12,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    // Description
    elements.push(
      text(padding + 32, y + 22, achievement.description, {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );

    y += 32;
  }

  const totalHeight = y + padding - titleY;

  return { height: totalHeight, elements };
}
