import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  svg,
  g,
  text,
  rect,
  circle,
  path,
  image,
  line,
} from "../src/render/svg/builder.ts";
import { serialise } from "../src/render/svg/serialise.ts";
import type { SvgElement } from "../src/render/svg/builder.ts";

describe("SVG builder", () => {
  it("creates a rect element with attributes", () => {
    const el = rect(10, 20, 30, 40, { fill: "red", rx: 4 });
    assert.strictEqual(el.tag, "rect");
    assert.deepStrictEqual(el.attrs, {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      fill: "red",
      rx: 4,
    });
  });

  it("creates a text element with content", () => {
    const el = text(5, 10, "Hello", { fill: "white" });
    assert.strictEqual(el.tag, "text");
    assert.strictEqual(el.text, "Hello");
    assert.deepStrictEqual(el.attrs, { x: 5, y: 10, fill: "white" });
  });

  it("creates a group with children", () => {
    const child = rect(0, 0, 10, 10, { fill: "blue" });
    const el = g({ transform: "translate(0,10)" }, child);
    assert.strictEqual(el.tag, "g");
    assert.deepStrictEqual(el.attrs, { transform: "translate(0,10)" });
    assert.deepStrictEqual(el.children, [child]);
  });

  it("creates a circle element", () => {
    const el = circle(50, 50, 25, { fill: "green" });
    assert.strictEqual(el.tag, "circle");
    assert.deepStrictEqual(el.attrs, { cx: 50, cy: 50, r: 25, fill: "green" });
  });

  it("creates a path element", () => {
    const el = path("M10 10L20 20", { fill: "none", stroke: "black" });
    assert.strictEqual(el.tag, "path");
    assert.deepStrictEqual(el.attrs, {
      d: "M10 10L20 20",
      fill: "none",
      stroke: "black",
    });
  });

  it("creates an image element", () => {
    const el = image(0, 0, 64, 64, "https://example.com/avatar.png");
    assert.strictEqual(el.tag, "image");
    assert.deepStrictEqual(el.attrs, {
      x: 0,
      y: 0,
      width: 64,
      height: 64,
      href: "https://example.com/avatar.png",
    });
  });

  it("creates an svg root with children", () => {
    const child = rect(0, 0, 100, 100, { fill: "black" });
    const el = svg({ width: 100, height: 100, viewBox: "0 0 100 100" }, child);
    assert.strictEqual(el.tag, "svg");
    assert.deepStrictEqual(el.attrs, {
      width: 100,
      height: 100,
      viewBox: "0 0 100 100",
    });
    assert.deepStrictEqual(el.children, [child]);
  });

  it("creates a line element with coordinates", () => {
    const el = line(0, 10, 100, 10, { stroke: "#ccc", "stroke-width": 1 });
    assert.strictEqual(el.tag, "line");
    assert.strictEqual(el.attrs.x1, 0);
    assert.strictEqual(el.attrs.y1, 10);
    assert.strictEqual(el.attrs.x2, 100);
    assert.strictEqual(el.attrs.y2, 10);
    assert.strictEqual(el.attrs.stroke, "#ccc");
  });
});

describe("SVG serialiser", () => {
  it("serialises a simple rect to SVG string", () => {
    const el: SvgElement = {
      tag: "rect",
      attrs: { x: 0, y: 0, width: 100, height: 50, fill: "#fff" },
    };
    const result = serialise(el);
    assert.ok(result.includes("<rect"));
    assert.ok(result.includes('width="100"'));
    assert.ok(result.includes('fill="#fff"'));
    assert.ok(result.includes("/>"));
  });

  it("serialises text content with XML escaping", () => {
    const el: SvgElement = {
      tag: "text",
      attrs: { x: 10, y: 20 },
      text: "Hello & <World>",
    };
    const result = serialise(el);
    assert.ok(result.includes("Hello &amp; &lt;World&gt;"));
    assert.ok(result.includes("</text>"));
  });

  it("serialises nested groups", () => {
    const tree = svg(
      { xmlns: "http://www.w3.org/2000/svg", width: 200, height: 100 },
      g(
        { transform: "translate(0,10)" },
        text(16, 14, "Title", { fill: "white", "font-size": 14 }),
        rect(16, 20, 168, 1, { fill: "grey" }),
      ),
    );

    const result = serialise(tree);
    assert.ok(result.startsWith("<svg"));
    assert.ok(result.includes("<g"));
    assert.ok(result.includes("<text"));
    assert.ok(result.includes("Title"));
    assert.ok(result.includes("<rect"));
    assert.ok(result.endsWith("</svg>"));
  });

  it("handles self-closing elements correctly", () => {
    const el: SvgElement = {
      tag: "image",
      attrs: {
        x: 0,
        y: 0,
        width: 64,
        height: 64,
        href: "https://example.com/img.png",
      },
    };
    const result = serialise(el);
    assert.ok(result.includes("/>"));
    assert.ok(!result.includes("</image>"));
  });

  it("escapes ampersands in attribute values", () => {
    const el: SvgElement = {
      tag: "image",
      attrs: { href: "https://example.com/img?a=1&b=2" },
    };
    const result = serialise(el);
    assert.ok(result.includes("a=1&amp;b=2"));
  });

  it("serialises an empty group as self-closing", () => {
    const el: SvgElement = { tag: "g", attrs: { id: "empty" } };
    const result = serialise(el);
    assert.ok(result.startsWith("<g"));
    assert.ok(result.includes("/>"));
  });
});
