/**
 * Empty-state rendering — shown when a plugin has no data.
 *
 * Renders a section header with a brief message explaining the
 * absence, rather than producing an invisible section or an
 * empty box in the gallery.
 */

import { text } from "../render/svg/builder.ts";
import type { RenderContext, RenderResult } from "../plugins/types.ts";

/** Render an empty-state section with a header and message. */
export function emptySection(
  title: string,
  message: string,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  const elements: import("../render/svg/builder.ts").SvgElement[] = [
    text(padding, 14, title, {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
    text(padding, 32, message, {
      fill: colours.textTertiary,
      "font-size": 11,
      "font-family": fontStack,
    }),
  ];

  return { height: 48, elements };
}
