/**
 * SVG output — serialise, optimise, write.
 *
 * SVGO optimisation is applied to reduce file size while preserving:
 * - `<style>` elements (font embedding)
 * - `<image>` elements (avatar images)
 * - Text content (plugin labels and values)
 * - `viewBox` attribute (responsive scaling)
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { optimize } from "svgo";

/**
 * Write an SVG string to a file with SVGO optimisation.
 *
 * Creates parent directories if needed.
 */
export async function writeSvg(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  const result = optimize(content, {
    plugins: [
      "cleanupAttrs",
      "removeDoctype",
      "removeXMLProcInst",
      "removeComments",
      "removeMetadata",
      // removeTitle and removeDesc removed — they strip
      // <title> and <desc> elements needed for accessibility
      "removeUselessDefs",
      "removeEditorsNSData",
      "removeEmptyAttrs",
      "removeHiddenElems",
      "removeEmptyContainers",
      "cleanupEnableBackground",
      "convertColors",
      "convertPathData",
      "convertTransform",
      "removeUnknownsAndDefaults",
      "removeNonInheritableGroupAttrs",
      "removeUselessStrokeAndFill",
      "removeUnusedNS",
      {
        name: "cleanupIds",
        params: {
          // Preserve skyline animation class
          preserve: ["skyline-scene"],
        },
      },
      "cleanupNumericValues",
      "cleanupListOfValues",
      "moveElemsAttrsToGroup",
      "moveGroupAttrsToElems",
      // collapseGroups removed — would merge the skyline-scene
      // animation group into its parent, breaking CSS animation
      "mergePaths",
      "convertShapeToPath",
      "sortAttrs",
      "sortDefsChildren",
    ],
  });

  await writeFile(path, result.data, "utf-8");
}
