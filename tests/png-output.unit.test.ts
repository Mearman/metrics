/**
 * Tests for PNG output via resvg-js.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { writePng } from "../src/output/png.ts";
import { serialise } from "../src/render/svg/serialise.ts";
import { svg, rect, text } from "../src/render/svg/builder.ts";
import { readFile, stat, unlink } from "node:fs/promises";

const TEST_PATH = "/tmp/metrics-png-test.png";

describe("PNG output", () => {
  it("writes a valid PNG file from SVG content", async () => {
    const svgEl = svg(
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: 200,
        viewBox: "0 0 200 100",
      },
      rect(0, 0, 200, 100, { fill: "#0d1117" }),
      text(10, 30, "Hello PNG", { fill: "#e6edf3", "font-size": 16 }),
    );
    const svgContent = serialise(svgEl);

    await writePng(TEST_PATH, svgContent);

    const fileStat = await stat(TEST_PATH);
    assert.ok(fileStat.size > 0, "PNG file should not be empty");

    // Verify PNG magic bytes
    const buffer = await readFile(TEST_PATH);
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    assert.ok(isPng, "File should start with PNG magic bytes");

    await unlink(TEST_PATH);
  });

  it("respects the scale parameter", async () => {
    const svgEl = svg(
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: 100,
        viewBox: "0 0 100 50",
      },
      rect(0, 0, 100, 50, { fill: "#ffffff" }),
    );
    const svgContent = serialise(svgEl);

    const scale1Path = "/tmp/metrics-png-scale1.png";
    const scale3Path = "/tmp/metrics-png-scale3.png";

    await writePng(scale1Path, svgContent, 1);
    await writePng(scale3Path, svgContent, 3);

    const stat1 = await stat(scale1Path);
    const stat3 = await stat(scale3Path);

    // Higher scale should produce a larger file
    assert.ok(
      stat3.size > stat1.size,
      "3× scale should produce larger PNG than 1×",
    );

    await unlink(scale1Path);
    await unlink(scale3Path);
  });
});
