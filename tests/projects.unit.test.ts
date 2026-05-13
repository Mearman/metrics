/**
 * Tests for Projects plugin — renderer.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderProjects } from "../src/plugins/projects/render.ts";
import type { ProjectsData } from "../src/plugins/projects/source.ts";
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

function makeCtx(): RenderContext {
  return {
    measure: stubMeasure,
    theme: testTheme,
    icons: stubIcons,
    contentWidth: 448,
    repos: { fetch: "public" as const, rules: [] },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Projects renderer", () => {
  it("returns empty for no projects", () => {
    const data: ProjectsData = { totalProjects: 0, projects: [] };
    const result = renderProjects(data, {}, makeCtx());
    assert.ok(result.height > 0, "Expected non-zero height for empty state");
    assert.ok(
      result.elements.length > 0,
      "Expected elements for empty state message",
    );
  });

  it("renders section title with total count", () => {
    const data: ProjectsData = {
      totalProjects: 4,
      projects: [
        { title: "PhD", description: "Research tasks", itemCount: 12 },
      ],
    };
    const result = renderProjects(data, {}, makeCtx());
    const title = findTextsDeep(result.elements).find((el) =>
      el.text?.includes("Projects"),
    );
    assert.ok(title !== undefined);
    assert.ok(title.text?.includes("4"));
  });

  it("renders project titles", () => {
    const data: ProjectsData = {
      totalProjects: 2,
      projects: [
        { title: "Roadmap", description: "", itemCount: 5 },
        { title: "Backlog", description: "", itemCount: 3 },
      ],
    };
    const result = renderProjects(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("Roadmap")));
    assert.ok(allTexts.some((el) => el.text?.includes("Backlog")));
  });

  it("renders item counts", () => {
    const data: ProjectsData = {
      totalProjects: 1,
      projects: [{ title: "PhD", description: "", itemCount: 42 }],
    };
    const result = renderProjects(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("42 items")));
  });

  it("renders descriptions when present", () => {
    const data: ProjectsData = {
      totalProjects: 1,
      projects: [
        { title: "Research", description: "My research tasks", itemCount: 7 },
      ],
    };
    const result = renderProjects(data, { descriptions: true }, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("My research")));
  });

  it("computes positive height", () => {
    const data: ProjectsData = {
      totalProjects: 1,
      projects: [{ title: "Project", description: "", itemCount: 1 }],
    };
    const result = renderProjects(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});
