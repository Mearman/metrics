/**
 * Text layout utilities for SVG rendering.
 *
 * Truncation and word-wrapping for text that must fit within
 * a fixed pixel width in the SVG output.
 */

import type { Measure } from "../../plugins/types.ts";

/**
 * Truncate text to fit within a maximum pixel width.
 *
 * Removes characters from the end until the string plus an
 * ellipsis fits. Returns the original string if it already fits.
 */
export function truncateText(
  content: string,
  maxWidth: number,
  fontSize: number,
  measure: Measure,
): string {
  if (content.length === 0) return content;
  if (measure.textWidth(content, fontSize) <= maxWidth) return content;
  let truncated = content;
  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    if (measure.textWidth(`${truncated}…`, fontSize) <= maxWidth) {
      return `${truncated}…`;
    }
  }
  return "…";
}

/**
 * Word-wrap text into lines that fit within a maximum pixel width.
 *
 * Splits on spaces. Each line is guaranteed to fit within `maxWidth`
 * at the given `fontSize`. Returns an array of lines.
 */
export function wrapText(
  content: string,
  maxWidth: number,
  fontSize: number,
  measure: Measure,
): string[] {
  if (content.length === 0) return [];
  const words = content.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const test = currentLine.length === 0 ? word : `${currentLine} ${word}`;
    if (
      measure.textWidth(test, fontSize) > maxWidth &&
      currentLine.length > 0
    ) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}
