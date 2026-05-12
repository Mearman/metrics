import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createMeasure } from "../src/render/layout/measure.ts";

describe("Text measurement", () => {
  let measure: ReturnType<typeof createMeasure>;

  beforeEach(() => {
    measure = createMeasure();
  });

  it("returns non-zero width for any string", () => {
    const width = measure.textWidth("Hello, World!", 14);
    assert.ok(width > 0, "Expected positive width for non-empty string");
  });

  it("returns increasing width for longer strings", () => {
    const short = measure.textWidth("Hi", 14);
    const long = measure.textWidth("Hello, World!", 14);
    assert.ok(long > short, "Expected longer string to have greater width");
  });

  it("returns increasing width for larger font sizes", () => {
    const small = measure.textWidth("Test", 10);
    const large = measure.textWidth("Test", 20);
    assert.ok(large > small, "Expected larger font to have greater width");
  });

  it("returns zero for empty string", () => {
    const width = measure.textWidth("", 14);
    assert.strictEqual(width, 0);
  });

  it("computes text block height", () => {
    const height = measure.textBlockHeight(
      ["Line 1", "Line 2", "Line 3"],
      14,
      1.5,
    );
    assert.ok(height > 0, "Expected positive height for non-empty block");
  });

  it("computes greater height for more lines", () => {
    const short = measure.textBlockHeight(["One"], 14, 1.5);
    const tall = measure.textBlockHeight(["One", "Two", "Three"], 14, 1.5);
    assert.ok(tall > short, "Expected more lines to have greater height");
  });
});
