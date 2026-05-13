import * as z from "zod";
/**
 * Notable plugin — renderer.
 *
 * Renders notable contribution organisations as an avatar row.
 */

import { text, image, g } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { NotableConfig } from "./source.ts";
import type { NotableData } from "./source.ts";
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

/**
 * Render notable contributions as avatar row with org names.
 */
export function renderNotable(
  data: NotableData,
  config: z.input<typeof NotableConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.contributions.length === 0) {
    return emptySection(
      "Notable contributions",
      "No notable contributions found",
      ctx,
    );
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems } = sectionHeader(
    "Notable contributions",
    ctx,
    {
      pluginId: "notable",
    },
  );
  elements.push(...headerElems);

  const avatarSize = 32;
  const labelWidth = 90;
  const gap = labelWidth - avatarSize;
  const step = avatarSize + gap;
  const cols = Math.min(
    data.contributions.length,
    Math.floor(ctx.contentWidth / step),
  );

  const avatarElements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const totalRows = Math.ceil(data.contributions.length / cols);

  let i = 0;
  for (const org of data.contributions) {
    const row = Math.floor(i / cols);
    const isLastRow = row === totalRows - 1;
    const itemsInRow = isLastRow
      ? data.contributions.length - row * cols
      : cols;
    const col = i % cols;
    const rowWidth = itemsInRow * step;
    const rowOffset = isLastRow ? (cols * step - rowWidth) / 2 : 0;
    const x = rowOffset + col * step;
    const y = row * (avatarSize + 22);

    // Centre the avatar within the column
    const avatarX = x + (step - avatarSize) / 2;
    const displayName = truncateText(org.name, step - 4, 10, ctx.measure);
    const labelWidth = ctx.measure.textWidth(displayName, 10);
    const labelX = x + (step - labelWidth) / 2;

    avatarElements.push(
      image(avatarX, y, avatarSize, avatarSize, org.avatarUrl),
    );
    avatarElements.push(
      text(labelX, y + avatarSize + 12, displayName, {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
        "text-anchor": "start",
      }),
    );
    i++;
  }

  elements.push(
    g({ transform: `translate(${String(padding)},24)` }, ...avatarElements),
  );

  const rows = Math.ceil(data.contributions.length / cols);
  const totalHeight = 24 + rows * (avatarSize + 22) + padding;

  return { height: totalHeight, elements };
}
