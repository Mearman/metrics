/**
 * Empty-state rendering — shown when a plugin has no data.
 *
 * Renders a section header with a brief message explaining the
 * absence, rather than producing an invisible section or an
 * empty box in the gallery.
 */

import { text } from "../render/svg/builder.ts";
import type { RenderContext, RenderResult } from "../plugins/types.ts";
import { sectionHeader } from "../render/svg/header.ts";

/** Render an empty-state section with a header and message. */
export function emptySection(
  title: string,
  message: string,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  const parts = title.toLowerCase().split(" ");
  const pluginId = parts[0] ?? "";
  const { elements: headerElems } = sectionHeader(title, ctx, {
    pluginId,
  });
  const messageY = 32;
  const messageElements = [
    text(padding, messageY, message, {
      fill: colours.textTertiary,
      "font-size": 11,
      "font-family": fontStack,
    }),
  ];

  return { height: 48, elements: [...headerElems, ...messageElements] };
}
