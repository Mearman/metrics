/**
 * Base plugin renderer — user profile header.
 *
 * Renders avatar, name, bio, and key stats as an SVG section.
 */

import { text, image } from "../../render/svg/builder.ts";
import type { SvgElement } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { UserProfile } from "./source.ts";

/** Format a large number with comma separators. */
function formatNumber(n: number): string {
  return n.toLocaleString("en-GB");
}

/**
 * Render the user profile header section.
 */
export function renderProfile(
  profile: UserProfile,
  ctx: RenderContext,
): RenderResult {
  const padding = ctx.theme.sectionPadding;
  const avatarSize = 64;
  const avatarGap = 16;
  const contentX = padding + avatarSize + avatarGap;
  const { colours, fontStack } = ctx.theme;

  const elements: SvgElement[] = [];

  // Avatar — at top of section, no top padding (pipeline handles margin)
  elements.push(image(padding, 0, avatarSize, avatarSize, profile.avatarUrl));

  // Name
  const nameY = 24;
  elements.push(
    text(contentX, nameY, profile.name, {
      fill: colours.text,
      "font-size": 20,
      "font-weight": 700,
      "font-family": fontStack,
    }),
  );

  // Login (secondary)
  const loginY = nameY + 22;
  elements.push(
    text(contentX, loginY, `@${profile.login}`, {
      fill: colours.textSecondary,
      "font-size": 14,
      "font-family": fontStack,
    }),
  );

  // Bio
  let bioY = loginY;
  if (profile.bio !== null) {
    bioY += 22;
    elements.push(
      text(contentX, bioY, profile.bio, {
        fill: colours.textSecondary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );
  }

  // Stats row
  const statsY = bioY + 28;
  const stats: string[] = [];
  if (profile.followers > 0) {
    stats.push(`${formatNumber(profile.followers)} followers`);
  }
  if (profile.following > 0) {
    stats.push(`${formatNumber(profile.following)} following`);
  }
  stats.push(`${formatNumber(profile.publicRepositories)} repos`);

  elements.push(
    text(contentX, statsY, stats.join(" · "), {
      fill: colours.textTertiary,
      "font-size": 11,
      "font-family": fontStack,
    }),
  );

  // Section height: bottom of stats + padding
  const totalHeight = statsY + padding;

  return { height: totalHeight, elements };
}
