/**
 * Font embedding for SVG output.
 *
 * Embeds font data as a base64-encoded CSS @font-face declaration
 * inside the SVG so the image renders correctly on any host.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Path to the bundled Roboto font */
const FONT_PATH = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "fonts",
  "Roboto-Regular.ttf",
);

let cachedCss: string | undefined;

/**
 * Generate a CSS @font-face block embedding the font as base64.
 *
 * Returns a `<style>` element string suitable for inclusion in the SVG root.
 * Caches the result after first call.
 */
export function embeddedFontCss(): string {
  if (cachedCss !== undefined) return cachedCss;

  const parts: string[] = [];

  const regular = embedFontFace(FONT_PATH, "'Roboto'", "normal", "400");
  if (regular !== undefined) parts.push(regular);

  cachedCss = parts.join("\n");
  return cachedCss;
}

function embedFontFace(
  fontPath: string,
  fontFamily: string,
  fontStyle: string,
  fontWeight: string,
): string | undefined {
  try {
    const buffer = readFileSync(fontPath);
    const base64 = buffer.toString("base64");
    return [
      "@font-face {",
      `  font-family: ${fontFamily};`,
      `  font-style: ${fontStyle};`,
      `  font-weight: ${fontWeight};`,
      `  src: url("data:font/truetype;base64,${base64}") format("truetype");`,
      "}",
    ].join("\n");
  } catch {
    // Font file not found — skip embedding
    return undefined;
  }
}
