/**
 * SVG output — write SVG files with optional SVGO optimisation.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Write an SVG string to a file.
 *
 * Creates parent directories if needed.
 * TODO: Wire up SVGO optimisation before writing.
 */
export async function writeSvg(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  // TODO: Run SVGO optimisation
  await writeFile(path, content, "utf-8");
}
