/**
 * Introduction plugin — renderer.
 *
 * Renders a profile card with avatar, name, bio, location,
 * company, and join date. Similar to the base plugin header
 * but focused on the "about me" card style.
 */

import { text, image } from "../../render/svg/builder.ts";
import { wrapText } from "../../render/layout/text.ts";
import * as z from "zod";
import type { RenderResult, RenderContext } from "../types.ts";
import { IntroductionConfig } from "./source.ts";
import type { IntroductionData } from "./source.ts";
import { sectionHeader } from "../../render/svg/header.ts";

/**
 * Format an ISO date string as "Joined Month Year".
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const month = date.toLocaleString("en-GB", { month: "long" });
  return `Joined ${month} ${String(date.getFullYear())}`;
}

/**
 * Render the introduction card.
 */
export function renderIntroduction(
  data: IntroductionData,
  config: z.input<typeof IntroductionConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  const bio = typeof config.text === "string" ? config.text : data.bio;

  // Section title
  // Header with icon
  const { elements: headerElems } = sectionHeader("Introduction", ctx, {
    pluginId: "introduction",
  });
  elements.push(...headerElems);

  let y = 30;

  // Avatar + name + login
  const avatarSize = 48;
  elements.push(image(padding, y, avatarSize, avatarSize, data.avatarUrl));

  elements.push(
    text(padding + avatarSize + 12, y + 14, data.name, {
      fill: colours.text,
      "font-size": 13,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  elements.push(
    text(padding + avatarSize + 12, y + 30, `@${data.login}`, {
      fill: colours.textSecondary,
      "font-size": 12,
      "font-family": fontStack,
    }),
  );

  y += avatarSize + 16;

  // Bio
  if (bio !== null && bio.length > 0) {
    const maxWidth = ctx.contentWidth - padding;
    const lines = wrapText(bio, maxWidth, 12, ctx.measure);

    for (const line of lines) {
      elements.push(
        text(padding, y + 12, line, {
          fill: colours.textSecondary,
          "font-size": 12,
          "font-family": fontStack,
        }),
      );
      y += 16;
    }
    y += 4;
  }

  // Metadata row — location, company, twitter, website
  const metaItems: string[] = [];
  if (data.location !== null) metaItems.push(`📍 ${data.location}`);
  if (data.company !== null) metaItems.push(`🏢 ${data.company}`);
  if (data.twitter !== null) metaItems.push(`🐦 @${data.twitter}`);
  if (data.website !== null) metaItems.push(`🔗 ${data.website}`);

  if (metaItems.length > 0) {
    // Render metadata items in rows of 2
    let col = 0;
    const colWidth = ctx.contentWidth / 2;
    for (const item of metaItems) {
      const x = padding + col * colWidth;
      elements.push(
        text(x, y + 12, item, {
          fill: colours.textTertiary,
          "font-size": 11,
          "font-family": fontStack,
        }),
      );
      col++;
      if (col >= 2) {
        col = 0;
        y += 16;
      }
    }
    if (col !== 0) y += 16;
    y += 4;
  }

  // Join date
  elements.push(
    text(padding, y + 12, formatDate(data.joinedAt), {
      fill: colours.textTertiary,
      "font-size": 11,
      "font-family": fontStack,
    }),
  );
  y += 20;

  return { height: y + padding, elements };
}
