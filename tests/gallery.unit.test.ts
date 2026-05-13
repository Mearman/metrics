import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { categorise, generateIndex } from "../src/output/gallery.ts";

describe("Gallery page generation", () => {
  describe("categorise", () => {
    it("identifies preset outputs", () => {
      const entry = categorise("output/github-metrics.svg");
      assert.deepStrictEqual(entry, {
        path: "output/github-metrics.svg",
        label: "Full dashboard",
        group: "preset",
      });
    });

    it("identifies compact preset", () => {
      const entry = categorise("output/compact.svg");
      assert.deepStrictEqual(entry, {
        path: "output/compact.svg",
        label: "Compact profile",
        group: "preset",
      });
    });

    it("identifies plugin outputs", () => {
      const entry = categorise("output/plugins/languages.svg");
      assert.deepStrictEqual(entry, {
        path: "output/plugins/languages.svg",
        label: "Languages",
        group: "plugin",
      });
    });

    it("handles multi-word plugin names", () => {
      const entry = categorise("output/plugins/isocalendar.svg");
      assert.strictEqual(entry.label, "Isocalendar");
      assert.strictEqual(entry.group, "plugin");
    });
  });

  describe("generateIndex", () => {
    it("produces valid HTML with title", () => {
      const html = generateIndex(
        ["output/github-metrics.svg", "output/plugins/base.svg"],
        "TestUser",
      );
      assert.ok(html.includes("<!DOCTYPE html>"));
      assert.ok(html.includes("<title>Metrics — TestUser</title>"));
      assert.ok(html.includes("Full dashboard"));
      assert.ok(html.includes("Base"));
    });

    it("includes preset and plugin sections", () => {
      const html = generateIndex(
        [
          "output/github-metrics.svg",
          "output/plugins/languages.svg",
          "output/plugins/base.svg",
        ],
        "TestUser",
      );
      assert.ok(html.includes("<h2>Presets</h2>"));
      assert.ok(html.includes("<h2>Plugins</h2>"));
    });

    it("omits sections when no entries match", () => {
      const html = generateIndex(["output/plugins/base.svg"], "TestUser");
      assert.ok(!html.includes("<h2>Presets</h2>"));
      assert.ok(html.includes("<h2>Plugins</h2>"));
    });

    it("escapes HTML in username", () => {
      const html = generateIndex([], "<script>alert('xss')</script>");
      assert.ok(!html.includes("<script>"));
      assert.ok(html.includes("&lt;script&gt;"));
    });

    it("escapes HTML in paths", () => {
      const html = generateIndex(
        ['output/plugins/test.svg" onload="alert(1)'],
        "TestUser",
      );
      assert.ok(!html.includes('onload="alert'));
    });

    it("includes noindex meta tag", () => {
      const html = generateIndex([], "TestUser");
      assert.ok(html.includes('<meta name="robots" content="noindex">'));
    });

    it("includes lazy loading on images", () => {
      const html = generateIndex(["output/plugins/base.svg"], "TestUser");
      assert.ok(html.includes('loading="lazy"'));
    });

    it("strips output/ prefix from paths", () => {
      const html = generateIndex(
        ["output/github-metrics.svg", "output/plugins/base.svg"],
        "TestUser",
      );
      assert.ok(html.includes('src="github-metrics.svg"'));
      assert.ok(html.includes('src="plugins/base.svg"'));
      assert.ok(!html.includes('src="output/'));
    });

    it("includes timestamp", () => {
      const html = generateIndex([], "TestUser");
      assert.ok(html.includes("Last updated:"));
    });
  });
});
