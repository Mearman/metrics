/**
 * Tests for text layout utilities — truncation and word-wrapping.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { truncateText, wrapText } from "../src/render/layout/text.ts";
import type { Measure } from "../src/plugins/types.ts";

/** Measure that uses character count × 6 as width (simulates monospace). */
const stubMeasure: Measure = {
  textWidth: (content: string, fontSize: number) =>
    Math.ceil(content.length * fontSize * 0.6),
  textBlockHeight: (lines: string[], fontSize: number, lineHeight: number) =>
    Math.ceil(lines.length * fontSize * lineHeight),
};

describe("truncateText", () => {
  it("returns original text if it fits", () => {
    // "hi" at size 10 = 2 * 10 * 0.6 = 12px, fits in 100px
    assert.strictEqual(truncateText("hi", 100, 10, stubMeasure), "hi");
  });

  it("truncates and adds ellipsis when text overflows", () => {
    // "hello world" at size 10 = 11 * 10 * 0.6 = 66px, won't fit in 30px
    const result = truncateText("hello world", 30, 10, stubMeasure);
    assert.ok(result.endsWith("…"));
    assert.ok(result.length < "hello world".length);
  });

  it("returns just ellipsis for text that never fits", () => {
    // Single character "a" at size 10 = 6px, won't fit in 1px
    assert.strictEqual(truncateText("a", 1, 10, stubMeasure), "…");
  });

  it("handles empty string", () => {
    assert.strictEqual(truncateText("", 100, 10, stubMeasure), "");
  });

  it("truncates at character boundary", () => {
    // "abc" at size 10 = 3 * 6 = 18px. Width 12px allows "a…" = 2 * 6 = 12
    const result = truncateText("abc", 12, 10, stubMeasure);
    assert.strictEqual(result, "a…");
  });
});

describe("wrapText", () => {
  it("returns single line for text that fits", () => {
    // "hi" at size 10 = 12px, fits in 100px
    const lines = wrapText("hi", 100, 10, stubMeasure);
    assert.deepStrictEqual(lines, ["hi"]);
  });

  it("wraps long text into multiple lines", () => {
    // "hello world foo" at size 10 → each char is 6px
    // "hello" = 30px, "hello world" = 66px
    // With maxWidth 40px: "hello" fits (30px), "hello world" = 66px > 40px → wrap
    const lines = wrapText("hello world foo", 40, 10, stubMeasure);
    assert.ok(lines.length >= 2);
    assert.strictEqual(lines[0], "hello");
  });

  it("handles empty string", () => {
    assert.deepStrictEqual(wrapText("", 100, 10, stubMeasure), []);
  });

  it("preserves all words", () => {
    const input = "one two three four";
    const lines = wrapText(input, 30, 10, stubMeasure);
    const joined = lines.join(" ");
    assert.strictEqual(joined, input);
  });

  it("handles single word that overflows", () => {
    // "supercalifragilistic" at size 10 = 20 * 6 = 120px, maxWidth 40px
    // Single word stays on one line even if it overflows
    const lines = wrapText("supercalifragilistic", 40, 10, stubMeasure);
    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0], "supercalifragilistic");
  });

  it("wraps at word boundaries", () => {
    const lines = wrapText("a b c d e f", 12, 10, stubMeasure);
    // Each single char "a" = 6px, "a b" = 12px
    assert.ok(lines.length >= 3);
    for (const line of lines) {
      // Each line should be short enough (single words)
      assert.ok(stubMeasure.textWidth(line, 10) <= 12);
    }
  });
});
