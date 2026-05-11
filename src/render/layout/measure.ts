/**
 * Text measurement using fontkit.
 *
 * Measures text width and height without a browser, using font
 * glyph data directly. This is essential for pure SVG rendering
 * where exact layout must be computed server-side.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { create } from "fontkit";
import type { Measure } from "../../plugins/types.ts";

import type { Font } from "fontkit";

/** Default font path — bundled in the package. */
const DEFAULT_FONT_PATH = resolve(
  import.meta.dirname,
  "..",
  "..",
  "fonts",
  "Roboto-Regular.ttf",
);

/** Cache loaded fonts by path. */
const fontCache = new Map<string, Font>();

/**
 * Load a font from a file path.
 *
 * Results are cached — subsequent calls with the same path return
 * the cached font object.
 */
export function loadFont(fontPath: string = DEFAULT_FONT_PATH): Font {
  const cached = fontCache.get(fontPath);
  if (cached !== undefined) return cached;

  const buffer = readFileSync(fontPath);
  const result = create(buffer);
  if (!("layout" in result)) {
    throw new Error(`Expected a single font, got a collection: ${fontPath}`);
  }
  fontCache.set(fontPath, result);
  return result;
}

/**
 * Measure the advance width of a string at a given font size.
 */
function advanceWidth(font: Font, content: string, fontSize: number): number {
  const glyphRun = font.layout(content);
  let totalUnits = 0;
  for (const glyph of glyphRun.glyphs) {
    totalUnits += glyph.advanceWidth;
  }
  // Convert font units to pixels at the given size
  const pixels = (totalUnits / font.unitsPerEm) * fontSize;
  return Math.ceil(pixels);
}

/**
 * Create a text measurement utility backed by a font.
 *
 * @param fontPath - Path to a .ttf or .otf font file
 */
export function createMeasure(fontPath?: string): Measure {
  const font = loadFont(fontPath);

  return {
    textWidth(content: string, fontSize: number): number {
      return advanceWidth(font, content, fontSize);
    },

    textBlockHeight(
      lines: string[],
      fontSize: number,
      lineHeight: number,
    ): number {
      const lineHeightPx = fontSize * lineHeight;
      return Math.ceil(lines.length * lineHeightPx);
    },
  };
}
