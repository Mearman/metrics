/**
 * SVG optimisation (SVGO) and file writing.
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

/**
 * Optimise an SVG string using SVGO and write to disk.
 *
 * TODO: Wire up SVGO once the rendering pipeline is functional.
 */
export async function writeSvg(
  svgContent: string,
  outputPath: string,
): Promise<void> {
  const resolved = resolve(outputPath);
  // TODO: Run SVGO optimisation
  await writeFile(resolved, svgContent, "utf-8");
}
