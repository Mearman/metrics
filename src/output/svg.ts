/**
 * SVG output — serialise, optimise, write.
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
      "removeTitle",
      "removeDesc",
      "removeUselessDefs",
      "removeEditorsNSData",
      "removeEmptyAttrs",
      "removeHiddenElems",
      "removeEmptyText",
      "removeEmptyContainers",
      "removeViewBox",
      "cleanupEnableBackground",
      "minifyStyles",
      "convertStyleToAttrs",
      "convertColors",
      "convertPathData",
      "convertTransform",
      "removeUnknownsAndDefaults",
      "removeNonInheritableGroupAttrs",
      "removeUselessStrokeAndFill",
      "removeUnusedNS",
      "cleanupIds",
      "cleanupNumericValues",
      "cleanupListOfValues",
      "moveElemsAttrsToGroup",
      "moveGroupAttrsToElems",
      "collapseGroups",
      "removeRasterImages",
      "mergePaths",
      "convertShapeToPath",
      "sortAttrs",
      "sortDefsChildren",
    ],
  });

  await writeFile(path, result.data, "utf-8");
}
