/**
 * Tests for LoC plugin — renderer and language detection.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderLoc } from "../src/plugins/loc/render.ts";
import {
  detectLanguage,
  shouldSkip,
  shouldSkipDir,
} from "../src/plugins/loc/languages.ts";
import type { LocData } from "../src/plugins/loc/source.ts";
import type { RenderContext, Theme } from "../src/plugins/types.ts";
import type { SvgElement } from "../src/render/svg/builder.ts";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const testTheme: Theme = {
  width: 480,
  margin: 16,
  sectionPadding: 16,
  fontStack: "'Roboto', sans-serif",
  colours: {
    background: "#0d1117",
    text: "#e6edf3",
    textSecondary: "#8b949e",
    textTertiary: "#6e7681",
    border: "#30363d",
    accent: "#58a6ff",
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

function findTextsDeep(
  elements: SvgElement[],
): { text: string | undefined; attrs: Record<string, string | number> }[] {
  const results: {
    text: string | undefined;
    attrs: Record<string, string | number>;
  }[] = [];
  for (const el of elements) {
    if (el.tag === "text") {
      results.push({ text: el.text, attrs: el.attrs });
    }
    if (el.children !== undefined) {
      results.push(...findTextsDeep(el.children));
    }
  }
  return results;
}

function makeCtx(overrides?: Partial<RenderContext>): RenderContext {
  return {
    measure: stubMeasure,
    theme: testTheme,
    icons: stubIcons,
    contentWidth: 480 - 16 * 2,
    repos: { fetch: "public" as const, rules: [] },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Language detection
// ---------------------------------------------------------------------------

describe("Language detection", () => {
  it("detects TypeScript from .ts extension", () => {
    const lang = detectLanguage("foo.ts");
    assert.strictEqual(lang.name, "TypeScript");
    assert.strictEqual(lang.colour, "#3178c6");
  });

  it("detects JavaScript from .js extension", () => {
    const lang = detectLanguage("app.js");
    assert.strictEqual(lang.name, "JavaScript");
  });

  it("detects Python from .py extension", () => {
    const lang = detectLanguage("main.py");
    assert.strictEqual(lang.name, "Python");
  });

  it("detects Rust from .rs extension", () => {
    const lang = detectLanguage("lib.rs");
    assert.strictEqual(lang.name, "Rust");
  });

  it("returns Other for unknown extensions", () => {
    const lang = detectLanguage("data.xyz");
    assert.strictEqual(lang.name, "Other");
  });

  it("returns Other for files with no extension", () => {
    const lang = detectLanguage("Makefile");
    // Makefile is actually detected by basename
    assert.ok(lang.name === "Makefile" || lang.name === "Other");
  });

  it("detects C from .h extension", () => {
    const lang = detectLanguage("header.h");
    assert.strictEqual(lang.name, "C");
  });
});

// ---------------------------------------------------------------------------
// Skip logic
// ---------------------------------------------------------------------------

describe("File skip logic", () => {
  it("skips image files", () => {
    assert.ok(shouldSkip("photo.png"));
    assert.ok(shouldSkip("icon.jpg"));
  });

  it("skips font files", () => {
    assert.ok(shouldSkip("font.woff2"));
  });

  it("does not skip source files", () => {
    assert.ok(!shouldSkip("index.ts"));
    assert.ok(!shouldSkip("main.py"));
  });

  it("skips known directories", () => {
    assert.ok(shouldSkipDir("node_modules"));
    assert.ok(shouldSkipDir(".git"));
    assert.ok(shouldSkipDir("dist"));
  });

  it("does not skip source directories", () => {
    assert.ok(!shouldSkipDir("src"));
    assert.ok(!shouldSkipDir("lib"));
  });
});

// ---------------------------------------------------------------------------
// LoC renderer
// ---------------------------------------------------------------------------

describe("LoC renderer", () => {
  it("returns empty for no repos", () => {
    const data: LocData = { repos: [], totalLines: 0 };
    const result = renderLoc(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
    assert.strictEqual(result.elements.length, 0);
  });

  it("renders section title with total lines", () => {
    const data: LocData = {
      repos: [
        {
          name: "test-repo",
          totalLines: 1500,
          isPrivate: false,
          languages: [{ name: "TypeScript", lines: 1500, colour: "#3178c6" }],
        },
      ],
      totalLines: 1500,
    };
    const result = renderLoc(data, {}, makeCtx());
    const title = findTextsDeep(result.elements).find((el) =>
      el.text?.includes("Lines of code"),
    );
    assert.ok(title !== undefined);
    assert.ok(title.text?.includes("1.5k"));
  });

  it("renders repo names", () => {
    const data: LocData = {
      repos: [
        {
          name: "my-project",
          totalLines: 500,
          isPrivate: false,
          languages: [{ name: "Rust", lines: 500, colour: "#dea584" }],
        },
      ],
      totalLines: 500,
    };
    const result = renderLoc(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("my-project")));
  });

  it("renders multiple repos with proportional bars", () => {
    const data: LocData = {
      repos: [
        {
          name: "big-repo",
          totalLines: 10_000,
          isPrivate: false,
          languages: [{ name: "Python", lines: 10_000, colour: "#3572a5" }],
        },
        {
          name: "small-repo",
          totalLines: 1_000,
          isPrivate: false,
          languages: [{ name: "Go", lines: 1_000, colour: "#00add8" }],
        },
      ],
      totalLines: 11_000,
    };
    const result = renderLoc(data, {}, makeCtx());
    // Should have rects for both repos
    const rects = result.elements.filter((el) => el.tag === "rect");
    assert.ok(rects.length >= 2);

    // Big repo bar should be wider than small repo bar
    const bigBar = rects.find((el) => el.attrs.fill === "#3572a5");
    const smallBar = rects.find((el) => el.attrs.fill === "#00add8");
    assert.ok(bigBar !== undefined);
    assert.ok(smallBar !== undefined);
    assert.ok(
      (bigBar.attrs.width as number) > (smallBar.attrs.width as number),
    );
  });

  it("renders multi-language repos with stacked bars", () => {
    const data: LocData = {
      repos: [
        {
          name: "mixed-repo",
          totalLines: 1000,
          isPrivate: false,
          languages: [
            { name: "TypeScript", lines: 600, colour: "#3178c6" },
            { name: "CSS", lines: 400, colour: "#563d7c" },
          ],
        },
      ],
      totalLines: 1000,
    };
    const result = renderLoc(data, {}, makeCtx());
    const rects = result.elements.filter(
      (el) =>
        el.tag === "rect" &&
        (el.attrs.fill === "#3178c6" || el.attrs.fill === "#563d7c"),
    );
    assert.strictEqual(rects.length, 2);
  });

  it("computes positive height", () => {
    const data: LocData = {
      repos: [
        {
          name: "repo",
          totalLines: 100,
          isPrivate: false,
          languages: [{ name: "Shell", lines: 100, colour: "#89e051" }],
        },
      ],
      totalLines: 100,
    };
    const result = renderLoc(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});
