/**
 * Tests for font embedding.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { embeddedFontCss } from "../src/render/svg/font-embed.ts";

describe("Font embedding", () => {
  it("returns non-empty CSS", () => {
    const css = embeddedFontCss();
    assert.ok(css.length > 0);
  });

  it("contains @font-face declaration", () => {
    const css = embeddedFontCss();
    assert.ok(css.includes("@font-face"));
  });

  it("references Roboto font family", () => {
    const css = embeddedFontCss();
    assert.ok(css.includes("font-family: 'Roboto'"));
  });

  it("contains base64-encoded font data", () => {
    const css = embeddedFontCss();
    assert.ok(css.includes("data:font/truetype;base64,"));
  });

  it("caches the result", () => {
    const first = embeddedFontCss();
    const second = embeddedFontCss();
    assert.strictEqual(first, second);
  });
});
