/**
 * Tests for isocalendar, repositories, and discussions renderers.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderIsocalendar } from "../src/plugins/isocalendar/render.ts";
import { renderRepositories } from "../src/plugins/repositories/render.ts";
import { renderDiscussions } from "../src/plugins/discussions/render.ts";
import type { RenderContext, Theme } from "../src/plugins/types.ts";
import type { IsocalendarData } from "../src/plugins/isocalendar/source.ts";
import type { RepositoriesData } from "../src/plugins/repositories/source.ts";
import type { DiscussionsData } from "../src/plugins/discussions/source.ts";

// ---------------------------------------------------------------------------
// Shared fixtures
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
  textWidth: (content: string, fontSize: number) =>
    Math.ceil(content.length * fontSize * 0.6),
  textBlockHeight: (lines: string[], fontSize: number, lineHeight: number) =>
    Math.ceil(lines.length * fontSize * lineHeight),
};

const stubIcons = {
  get: (name: string) => {
    if (name === "repo")
      return "M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.5 2.5 0 012 11.5z";
    if (name === "repo-forked")
      return "M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0z";
    return "";
  },
};

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

/** Deep-find all text elements (including nested in groups). */
function findTextsDeep(
  elements: import("../src/render/svg/builder.ts").SvgElement[],
): import("../src/render/svg/builder.ts").SvgElement[] {
  const result: import("../src/render/svg/builder.ts").SvgElement[] = [];
  for (const el of elements) {
    if (el.text !== undefined) result.push(el);
    if (el.children) result.push(...findTextsDeep(el.children));
  }
  return result;
}

/** Deep-find all elements with a given tag (including nested). */
function findElementsByTag(
  elements: import("../src/render/svg/builder.ts").SvgElement[],
  tag: string,
): import("../src/render/svg/builder.ts").SvgElement[] {
  const result: import("../src/render/svg/builder.ts").SvgElement[] = [];
  for (const el of elements) {
    if (el.tag === tag) result.push(el);
    if (el.children) result.push(...findElementsByTag(el.children, tag));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Isocalendar renderer
// ---------------------------------------------------------------------------

describe("Isocalendar renderer", () => {
  const baseData: IsocalendarData = {
    weeks: [
      {
        contributionDays: [
          { date: "2025-01-06", count: 0, colour: "#161b22" },
          { date: "2025-01-07", count: 2, colour: "#0e4429" },
          { date: "2025-01-08", count: 5, colour: "#006d32" },
          { date: "2025-01-09", count: 8, colour: "#26a641" },
          { date: "2025-01-10", count: 15, colour: "#39d353" },
          { date: "2025-01-11", count: 0, colour: "#161b22" },
          { date: "2025-01-12", count: 1, colour: "#0e4429" },
        ],
      },
    ],
    totalContributions: 31,
  };

  it("renders section title", () => {
    const result = renderIsocalendar(baseData, {}, makeCtx());
    const title = result.elements.find((el) =>
      el.text?.includes("contributions"),
    );
    assert.ok(title !== undefined);
  });

  it("renders heatmap cells", () => {
    const result = renderIsocalendar(baseData, {}, makeCtx());
    // Cells are nested inside a <g> element
    const gridGroup = result.elements.find(
      (el) => el.tag === "g" && el.children !== undefined,
    );
    assert.ok(gridGroup !== undefined);
    const cells =
      gridGroup.children?.filter(
        (el) => el.tag === "rect" && el.attrs.rx === 1,
      ) ?? [];
    assert.strictEqual(cells.length, 7);
  });

  it("computes positive height", () => {
    const result = renderIsocalendar(baseData, {}, makeCtx());
    assert.ok(result.height > 0);
  });

  it("handles empty weeks", () => {
    const data: IsocalendarData = {
      weeks: [],
      totalContributions: 0,
    };
    const result = renderIsocalendar(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Repositories renderer
// ---------------------------------------------------------------------------

describe("Repositories renderer", () => {
  const baseData: RepositoriesData = {
    list: [
      {
        nameWithOwner: "user/repo",
        description: "A project",
        stargazerCount: 100,
        forkCount: 10,
        issues: { totalCount: 5 },
        pullRequests: { totalCount: 3 },
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
        licenseInfo: null,
        createdAt: "2024-01-01",
        isFork: false,
        isPrivate: false,
        sorting: "pinned",
      },
      {
        nameWithOwner: "user/forked-repo",
        description: "A forked project",
        stargazerCount: 5,
        forkCount: 0,
        issues: { totalCount: 0 },
        pullRequests: { totalCount: 0 },
        primaryLanguage: null,
        licenseInfo: null,
        createdAt: "2024-06-01",
        isFork: true,
        isPrivate: false,
        sorting: "starred",
      },
    ],
  };

  it("returns empty for no repos", () => {
    const data: RepositoriesData = { list: [] };
    const result = renderRepositories(data, {}, makeCtx());
    assert.ok(result.height > 0, "Expected non-zero height for empty state");
  });

  it("renders section title", () => {
    const result = renderRepositories(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text?.includes("Featured"));
    assert.ok(title !== undefined);
  });

  it("renders repo names", () => {
    const result = renderRepositories(baseData, {}, makeCtx());
    // Repo names are nested inside <g> groups
    const allTexts = findTextsDeep(result.elements);
    const name = allTexts.find((el) => el.text === "user/repo");
    assert.ok(name !== undefined);
  });

  it("renders descriptions", () => {
    const result = renderRepositories(baseData, {}, makeCtx());
    const desc = result.elements.find((el) => el.text === "A project");
    assert.ok(desc !== undefined);
  });

  it("renders language info for repos with language", () => {
    const result = renderRepositories(baseData, {}, makeCtx());
    // Language circle is nested in info group
    const allRects = findElementsByTag(result.elements, "circle");
    const langCircle = allRects.find((el) => el.attrs.fill === "#3178c6");
    assert.ok(langCircle !== undefined);
  });

  it("renders star and fork counts", () => {
    const result = renderRepositories(baseData, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    const stars = allTexts.find((el) => el.text?.includes("★"));
    const forks = allTexts.find((el) => el.text?.includes("⑂"));
    assert.ok(stars !== undefined);
    assert.ok(forks !== undefined);
  });

  it("computes positive height", () => {
    const result = renderRepositories(baseData, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Discussions renderer
// ---------------------------------------------------------------------------

describe("Discussions renderer", () => {
  const baseData: DiscussionsData = {
    totalCount: 42,
    categories: [
      { name: "General", discussionCount: 20 },
      { name: "Q&A", discussionCount: 15 },
      { name: "Ideas", discussionCount: 7 },
    ],
  };

  it("renders section title with count", () => {
    const result = renderDiscussions(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text?.includes("42"));
    assert.ok(title !== undefined);
  });

  it("renders category names", () => {
    const result = renderDiscussions(baseData, {}, makeCtx());
    const general = result.elements.find((el) => el.text === "General");
    const qa = result.elements.find((el) => el.text === "Q&A");
    assert.ok(general !== undefined);
    assert.ok(qa !== undefined);
  });

  it("renders category bars", () => {
    const result = renderDiscussions(baseData, {}, makeCtx());
    const bars = result.elements.filter(
      (el) => el.tag === "rect" && el.attrs.fill === "#58a6ff",
    );
    assert.ok(bars.length >= 3);
  });

  it("computes positive height", () => {
    const result = renderDiscussions(baseData, {}, makeCtx());
    assert.ok(result.height > 0);
  });

  it("handles zero discussions", () => {
    const data: DiscussionsData = {
      totalCount: 0,
      categories: [],
    };
    const result = renderDiscussions(data, {}, makeCtx());
    assert.ok(result.height > 0, "Expected non-zero height for empty state");
  });
});

// ---------------------------------------------------------------------------
// Code renderer
// ---------------------------------------------------------------------------

import { renderCode } from "../src/plugins/code/render.ts";
import type { CodeData } from "../src/plugins/code/source.ts";

describe("Code renderer", () => {
  it("renders empty state when no snippet", () => {
    const data: CodeData = { snippet: null };
    const result = renderCode(data, {}, makeCtx());
    assert.ok(result.height > 0, "Expected non-zero height for empty state");
  });

  it("renders section title", () => {
    const data: CodeData = {
      snippet: {
        repository: "user/repo",
        file: "src/index.ts",
        code: "console.log('hello')",
        language: "TypeScript",
        message: "Add logging",
      },
    };
    const result = renderCode(data, {}, makeCtx());
    const title = findTextsDeep(result.elements).find(
      (el) => el.text === "Code",
    );
    assert.ok(title !== undefined);
  });

  it("renders code lines in monospace", () => {
    const data: CodeData = {
      snippet: {
        repository: "user/repo",
        file: "main.py",
        code: "def hello():",
        language: "Python",
        message: "Init",
      },
    };
    const result = renderCode(data, {}, makeCtx());
    const codeText = findTextsDeep(result.elements).find((el) =>
      el.text?.includes("def hello"),
    );
    assert.ok(codeText !== undefined);
    assert.ok(String(codeText.attrs["font-family"]).includes("monospace"));
  });

  it("renders file path and language", () => {
    const data: CodeData = {
      snippet: {
        repository: "user/repo",
        file: "src/app.ts",
        code: "export {}",
        language: "TypeScript",
        message: "Setup",
      },
    };
    const result = renderCode(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    const fileLabel = allTexts.find((el) => el.text?.includes("app.ts"));
    assert.ok(fileLabel !== undefined);
  });

  it("computes positive height", () => {
    const data: CodeData = {
      snippet: {
        repository: "user/repo",
        file: "a.rs",
        code: "fn main() {}",
        language: "Rust",
        message: "Init",
      },
    };
    const result = renderCode(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});
