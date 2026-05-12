/**
 * Sponsorships plugin — renderer.
 *
 * Renders sponsored accounts as an avatar grid with monthly amount.
 */

import { text, image, g } from "../../render/svg/builder.ts";
import * as z from "zod";
import type { RenderResult, RenderContext } from "../types.ts";
import { SponsorshipsConfig } from "./source.ts";
import type { SponsorshipsData } from "./source.ts";

export function renderSponsorships(
  data: SponsorshipsData,
  config: z.input<typeof SponsorshipsConfig>,
  ctx: RenderContext,
): RenderResult {
  const resolvedSize = typeof config.size === "number" ? config.size : 28;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.sponsorships.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Sponsorships", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  // Total amount
  if (data.totalAmount > 0) {
    elements.push(
      text(
        padding,
        28,
        `$${String(data.totalAmount)}/month across ${String(data.totalCount)} sponsorships`,
        {
          fill: colours.textSecondary,
          "font-size": 11,
          "font-family": fontStack,
        },
      ),
    );
  }

  // Avatar grid
  const gap = 4;
  const cols = Math.floor(ctx.contentWidth / (resolvedSize + gap));

  const avatarElements: import("../../render/svg/builder.ts").SvgElement[] = [];
  let i = 0;
  for (const sponsorship of data.sponsorships) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    avatarElements.push(
      image(
        col * (resolvedSize + gap),
        row * (resolvedSize + gap),
        resolvedSize,
        resolvedSize,
        sponsorship.avatarUrl,
      ),
    );
    i++;
  }

  const rows = Math.ceil(data.sponsorships.length / cols);
  const gridY = data.totalAmount > 0 ? 42 : 24;

  elements.push(
    g(
      { transform: `translate(${String(padding)},${String(gridY)})` },
      ...avatarElements,
    ),
  );

  const totalHeight = gridY + rows * (resolvedSize + gap) + padding;

  return { height: totalHeight, elements };
}
