/**
 * Notable plugin — renderer.
 *
 * Renders notable contribution organisations as an avatar row.
 */

import { text, image, g } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { NotableData } from "./source.ts";

/**
 * Render notable contributions as avatar row with org names.
 */
export function renderNotable(
  data: NotableData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.contributions.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Notable contributions", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  const avatarSize = 32;
  const labelWidth = 80;
  const gap = labelWidth - avatarSize;
  const step = avatarSize + gap;
  const cols = Math.min(
    data.contributions.length,
    Math.floor(ctx.contentWidth / step),
  );

  const avatarElements: import("../../render/svg/builder.ts").SvgElement[] = [];

  let i = 0;
  for (const org of data.contributions) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * step;
    const y = row * (avatarSize + 22);

    const displayName = truncateText(org.name, step - 4, 10, ctx.measure);
    avatarElements.push(image(x, y, avatarSize, avatarSize, org.avatarUrl));
    avatarElements.push(
      text(x, y + avatarSize + 12, displayName, {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
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
