/**
 * PNG output — render SVG to raster via @resvg/resvg-js.
 *
 * resvg-js is a pure WASM SVG renderer — no native C++ bindings,
 * no Puppeteer, no browser dependency. Works in CI on any platform.
 */

import { Resvg } from "@resvg/resvg-js";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Render an SVG string to a PNG buffer and write to disk.
 *
 * @param path - Output file path (should end in .png)
 * @param svgContent - Serialised SVG string
 * @param scale - Pixel ratio (default 2 for retina)
 */
export async function writePng(
  path: string,
  svgContent: string,
  scale = 2,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });

  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: "width",
      value: 480 * scale,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  await writeFile(path, pngBuffer);
}
