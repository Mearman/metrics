/**
 * Tests for renderer functions — pure function tests that verify
 * SVG element output without network calls or file I/O.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderLanguages } from "../src/plugins/languages/render.ts";
import { renderGists } from "../src/plugins/gists/render.ts";
import type { RenderContext, Theme } from "../src/plugins/types.ts";
import type { LanguagesData } from "../src/plugins/languages/source.ts";
import type { GistsData } from "../src/plugins/gists/source.ts";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const testTheme: Theme = {
  width: 480,
  sectionPadding: 16,
  margin: 16,
  fontStack: "sans-serif",
  colours: {
    text: "#e6edf3",
    textSecondary: "#8b949e",
    textTertiary: "#6e7681",
    accent: "#58a6ff",
    background: "#0d1117",
    border: "#30363d",
    error: "#f85149",
    warning: "#d29922",
    success: "#3fb950",
    calendar: {
      L0: "#161b22",
      L1: "#0e4429",
      L2: "#006d32",
      L3: "#26a641",
      L4: "#39d353",
    },
  },
};

const stubMeasure = {
  textWidth: () => 50,
  textBlockHeight: (lines: string[], fontSize: number, lineHeight: number) =>
    Math.ceil(lines.length * fontSize * lineHeight),
};

const stubIcons = { get: () => "" };

function makeCtx(overrides?: Partial<RenderContext>): RenderContext {
  return {
    measure: stubMeasure,
    theme: testTheme,
    icons: stubIcons,
    contentWidth: 480 - 16 * 2,
    ...overrides,
  };
}

function makeLanguagesData(
  langs: { name: string; colour: string; size: number }[],
): LanguagesData {
  const totalBytes = langs.reduce((sum, l) => sum + l.size, 0);
  return { total: langs, totalBytes };
}

// ---------------------------------------------------------------------------
// Languages renderer
// ---------------------------------------------------------------------------

describe("Languages renderer", () => {
  it("returns empty result for zero languages", () => {
    const data = makeLanguagesData([]);
    const result = renderLanguages(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
    assert.strictEqual(result.elements.length, 0);
  });

  it("renders a title element", () => {
    const data = makeLanguagesData([
      { name: "TypeScript", colour: "#3178c6", size: 1000 },
    ]);
    const result = renderLanguages(data, {}, makeCtx());
    const title = result.elements.find((el) => el.text === "Languages");
    assert.ok(title !== undefined);
    assert.strictEqual(title.tag, "text");
  });

  it("renders a stacked bar with correct colours", () => {
    const data = makeLanguagesData([
      { name: "TypeScript", colour: "#3178c6", size: 700 },
      { name: "Python", colour: "#3572a5", size: 300 },
    ]);
    const result = renderLanguages(data, {}, makeCtx());
    const bars = result.elements.filter(
      (el) => el.tag === "rect" && el.attrs.height === 8,
    );
    assert.strictEqual(bars.length, 2);
    assert.strictEqual(bars[0]?.attrs.fill, "#3178c6");
    assert.strictEqual(bars[1]?.attrs.fill, "#3572a5");
  });

  it("respects the limit config option", () => {
    const langs = Array.from({ length: 10 }, (_, i) => ({
      name: `Lang${String(i)}`,
      colour: "#fff",
      size: 100 - i * 5,
    }));
    const data = makeLanguagesData(langs);
    const result = renderLanguages(data, { limit: 3, threshold: 0 }, makeCtx());
    // Title + 3 bars + 3 legend dots + 3 legend labels = 10
    // (bars are the rect elements with height=8, legend dots are height=10)
    const bars = result.elements.filter(
      (el) => el.tag === "rect" && el.attrs.height === 8,
    );
    assert.strictEqual(bars.length, 3);
  });

  it("filters languages below threshold percentage", () => {
    const data = makeLanguagesData([
      { name: "TypeScript", colour: "#3178c6", size: 900 },
      { name: "Small", colour: "#ccc", size: 10 },
    ]);
    const result = renderLanguages(data, { threshold: 5 }, makeCtx());
    // Small is 1.1% — below threshold
    const labels = result.elements.filter(
      (el) => el.tag === "text" && el.text !== "Languages",
    );
    // Only TypeScript should appear in labels
    const smallLabel = labels.find((el) => el.text?.includes("Small"));
    assert.strictEqual(smallLabel, undefined);
  });

  it("computes positive height for non-empty data", () => {
    const data = makeLanguagesData([
      { name: "TypeScript", colour: "#3178c6", size: 1000 },
    ]);
    const result = renderLanguages(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });

  it("produces only valid SVG element tags", () => {
    const data = makeLanguagesData([
      { name: "Rust", colour: "#dea584", size: 500 },
      { name: "Go", colour: "#00add8", size: 300 },
    ]);
    const result = renderLanguages(data, {}, makeCtx());
    const validTags = new Set([
      "text",
      "rect",
      "g",
      "svg",
      "circle",
      "path",
      "image",
    ]);
    for (const el of result.elements) {
      assert.ok(validTags.has(el.tag), `Unexpected tag: ${el.tag}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Gists renderer
// ---------------------------------------------------------------------------

describe("Gists renderer", () => {
  it("shows empty message when no gists", () => {
    const data: GistsData = {
      totalCount: 0,
      files: 0,
      stargazers: 0,
      forks: 0,
      comments: 0,
    };
    const result = renderGists(data, {}, makeCtx());
    const emptyMsg = result.elements.find(
      (el) => el.text === "No public gists",
    );
    assert.ok(emptyMsg !== undefined);
    assert.ok(result.height > 0);
  });

  it("renders stat values for non-zero gists", () => {
    const data: GistsData = {
      totalCount: 34,
      files: 53,
      stargazers: 27,
      forks: 4,
      comments: 1,
    };
    const result = renderGists(data, {}, makeCtx());
    // Should contain "34" as a stat value
    const statValue = result.elements.find((el) => el.text === "34");
    assert.ok(statValue !== undefined);
    assert.strictEqual(statValue.attrs["font-weight"], 700);
  });

  it("renders all five stat labels", () => {
    const data: GistsData = {
      totalCount: 5,
      files: 10,
      stargazers: 2,
      forks: 1,
      comments: 3,
    };
    const result = renderGists(data, {}, makeCtx());
    const expectedLabels = ["Gists", "Files", "Stars", "Forks", "Comments"];
    for (const label of expectedLabels) {
      const found = result.elements.find((el) => el.text === label);
      assert.ok(found !== undefined, `Missing label: ${label}`);
    }
  });

  it("renders a section title", () => {
    const data: GistsData = {
      totalCount: 1,
      files: 1,
      stargazers: 0,
      forks: 0,
      comments: 0,
    };
    const result = renderGists(data, {}, makeCtx());
    const title = result.elements.find(
      (el) => el.text === "Gists" && el.attrs["font-size"] === 14,
    );
    assert.ok(title !== undefined);
  });
});
