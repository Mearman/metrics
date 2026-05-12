/**
 * Code plugin — renderer.
 *
 * Renders a code snippet in a terminal-style card.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { CodeData } from "./source.ts";

/**
 * Render a code snippet card.
 */
export function renderCode(
  data: CodeData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Code", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  if (data.snippet === null) {
    elements.push(
      text(padding, 36, "No recent code snippets", {
        fill: colours.textTertiary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );
    return { height: 52, elements };
  }

  const snippet = data.snippet;
  const cardPadding = 12;
  const monospace = "'Courier New', monospace";
  let y = 30;

  // File path + language label
  const filePath = truncateText(
    `${snippet.file} (${snippet.language})`,
    ctx.contentWidth - cardPadding * 2,
    10,
    ctx.measure,
  );
  elements.push(
    text(padding + cardPadding, y + 10, filePath, {
      fill: colours.textTertiary,
      "font-size": 10,
      "font-family": fontStack,
    }),
  );
  y += 18;

  // Code card background
  const codeLines = snippet.code.split("\n");
  const lineHeight = 14;
  const codeBlockHeight = codeLines.length * lineHeight + cardPadding * 2;

  elements.push(
    rect(padding, y, ctx.contentWidth, codeBlockHeight, {
      fill: "#161b22",
      rx: 4,
      stroke: colours.border,
      "stroke-width": 0.5,
    }),
  );

  // Code lines
  let codeY = y + cardPadding;
  for (const line of codeLines) {
    const displayLine = truncateText(
      line,
      ctx.contentWidth - cardPadding * 4,
      11,
      ctx.measure,
    );
    elements.push(
      text(padding + cardPadding * 2, codeY + 10, displayLine, {
        fill: "#e6edf3",
        "font-size": 11,
        "font-family": monospace,
      }),
    );
    codeY += lineHeight;
  }

  y += codeBlockHeight + 8;

  // Repo + commit message
  const repoText = truncateText(
    `${snippet.repository}: ${snippet.message}`,
    ctx.contentWidth,
    10,
    ctx.measure,
  );
  elements.push(
    text(padding, y + 10, repoText, {
      fill: colours.textTertiary,
      "font-size": 10,
      "font-family": fontStack,
    }),
  );
  y += 20;

  return { height: y + padding, elements };
}
