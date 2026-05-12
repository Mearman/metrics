/**
 * Tests for the inline-images utility.
 */

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  inlineImages,
  clearImageCache,
} from "../src/render/svg/inline-images.ts";
import type { SvgElement } from "../src/render/svg/builder.ts";

describe("Inline images", () => {
  afterEach(() => {
    clearImageCache();
  });

  it("leaves non-image elements unchanged", async () => {
    const element: SvgElement = {
      tag: "rect",
      attrs: { x: 0, y: 0, width: 100, height: 50 },
    };
    const result = await inlineImages(element);
    assert.deepStrictEqual(result, element);
  });

  it("leaves data-URI images unchanged", async () => {
    const element: SvgElement = {
      tag: "image",
      attrs: {
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        href: "data:image/png;base64,abc123",
      },
    };
    const result = await inlineImages(element);
    assert.strictEqual(result.attrs.href, "data:image/png;base64,abc123");
  });

  it("leaves relative-path images unchanged", async () => {
    const element: SvgElement = {
      tag: "image",
      attrs: { x: 0, y: 0, width: 32, height: 32, href: "avatar.png" },
    };
    const result = await inlineImages(element);
    assert.strictEqual(result.attrs.href, "avatar.png");
  });

  it("returns original URL for unreachable http URLs", async () => {
    const element: SvgElement = {
      tag: "image",
      attrs: {
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        href: "http://nonexistent.invalid/image.png",
      },
    };
    const result = await inlineImages(element);
    assert.strictEqual(
      result.attrs.href,
      "http://nonexistent.invalid/image.png",
    );
  });

  it("recurses into children", async () => {
    const element: SvgElement = {
      tag: "g",
      attrs: {},
      children: [
        {
          tag: "image",
          attrs: {
            x: 0,
            y: 0,
            width: 32,
            height: 32,
            href: "data:image/png;base64,abc",
          },
        },
        {
          tag: "rect",
          attrs: { x: 0, y: 0, width: 100, height: 50 },
        },
      ],
    };
    const result = await inlineImages(element);
    assert.ok(result.children !== undefined);
    assert.strictEqual(result.children.length, 2);
    const img = result.children[0];
    assert.ok(img !== undefined);
    assert.strictEqual(img.attrs.href, "data:image/png;base64,abc");
  });
});
