/**
 * Tests for the introduction, reactions, and contributors renderers.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderIntroduction } from "../src/plugins/introduction/render.ts";
import { renderReactions } from "../src/plugins/reactions/render.ts";
import { renderContributors } from "../src/plugins/contributors/render.ts";
import type { RenderContext, Theme } from "../src/plugins/types.ts";
import type { SvgElement } from "../src/render/svg/builder.ts";
import type { IntroductionData } from "../src/plugins/introduction/source.ts";
import type { ReactionsData } from "../src/plugins/reactions/source.ts";
import type { ContributorsData } from "../src/plugins/contributors/source.ts";

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
    repos: { fetch: "public" as const, rules: [] },
    ...overrides,
  };
}

/** Recursively find all <text> elements in an SVG tree. */
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

// ---------------------------------------------------------------------------
// Introduction renderer
// ---------------------------------------------------------------------------

describe("Introduction renderer", () => {
  const baseData: IntroductionData = {
    name: "Test User",
    login: "testuser",
    avatarUrl: "https://example.com/avatar.png",
    bio: "Hello, I am a developer.",
    company: "Acme Corp",
    location: "London, UK",
    twitter: "testuser",
    website: "https://example.com",
    joinedAt: "2020-01-15T00:00:00Z",
  };

  it("renders a section title", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text === "Introduction");
    assert.ok(title !== undefined);
  });

  it("renders the user name and login", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    const name = result.elements.find((el) => el.text === "Test User");
    const login = result.elements.find((el) => el.text === "@testuser");
    assert.ok(name !== undefined);
    assert.ok(login !== undefined);
  });

  it("renders an avatar image", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    const avatar = result.elements.find(
      (el) =>
        el.tag === "image" &&
        el.attrs.href === "https://example.com/avatar.png",
    );
    assert.ok(avatar !== undefined);
  });

  it("renders the bio text", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    const bio = result.elements.find(
      (el) => el.text === "Hello, I am a developer.",
    );
    assert.ok(bio !== undefined);
  });

  it("renders location and company metadata", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    const location = result.elements.find((el) => el.text?.includes("London"));
    const company = result.elements.find((el) =>
      el.text?.includes("Acme Corp"),
    );
    assert.ok(location !== undefined);
    assert.ok(company !== undefined);
  });

  it("renders the join date", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    const joined = result.elements.find((el) => el.text?.includes("Joined"));
    assert.ok(joined !== undefined);
  });

  it("uses config.text over bio when provided", () => {
    const result = renderIntroduction(
      baseData,
      { text: "Custom text" },
      makeCtx(),
    );
    const custom = result.elements.find((el) => el.text === "Custom text");
    assert.ok(custom !== undefined);
  });

  it("computes positive height", () => {
    const result = renderIntroduction(baseData, {}, makeCtx());
    assert.ok(result.height > 0);
  });

  it("handles null bio gracefully", () => {
    const noBio = { ...baseData, bio: null };
    const result = renderIntroduction(noBio, {}, makeCtx());
    // Should still render title and avatar
    const title = result.elements.find((el) => el.text === "Introduction");
    assert.ok(title !== undefined);
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Reactions renderer
// ---------------------------------------------------------------------------

describe("Reactions renderer", () => {
  const baseData: ReactionsData = {
    totals: {
      total_count: 42,
      "+1": 15,
      "-1": 2,
      laugh: 5,
      hooray: 3,
      confused: 1,
      heart: 10,
      rocket: 4,
      eyes: 2,
    },
    items: [
      {
        repository: "owner/repo",
        type: "Issue",
        title: "Great feature request",
        reactions: {
          total_count: 20,
          "+1": 8,
          "-1": 1,
          laugh: 3,
          hooray: 2,
          confused: 0,
          heart: 4,
          rocket: 1,
          eyes: 1,
        },
      },
    ],
    scanned: 50,
  };

  it("renders a section title", () => {
    const result = renderReactions(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text === "Reactions");
    assert.ok(title !== undefined);
  });

  it("renders reaction bars for non-zero totals", () => {
    const result = renderReactions(baseData, {}, makeCtx());
    // Should have rect elements for bars
    const bars = result.elements.filter(
      (el) => el.tag === "rect" && el.attrs.fill === "#58a6ff",
    );
    assert.ok(bars.length > 0);
  });

  it("renders emoji labels for reactions", () => {
    const result = renderReactions(baseData, {}, makeCtx());
    const heartLabel = result.elements.find((el) => el.text?.includes("❤️"));
    const thumbsUp = result.elements.find((el) => el.text?.includes("👍"));
    assert.ok(heartLabel !== undefined);
    assert.ok(thumbsUp !== undefined);
  });

  it("shows most-reacted items", () => {
    const result = renderReactions(baseData, {}, makeCtx());
    const item = result.elements.find((el) =>
      el.text?.includes("Great feature request"),
    );
    assert.ok(item !== undefined);
  });

  it("shows scanned count when no items", () => {
    const emptyData: ReactionsData = {
      totals: {
        total_count: 0,
        "+1": 0,
        "-1": 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 0,
        rocket: 0,
        eyes: 0,
      },
      items: [],
      scanned: 30,
    };
    const result = renderReactions(emptyData, {}, makeCtx());
    const msg = result.elements.find((el) => el.text?.includes("No reactions"));
    assert.ok(msg !== undefined);
  });

  it("computes positive height", () => {
    const result = renderReactions(baseData, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Contributors renderer
// ---------------------------------------------------------------------------

describe("Contributors renderer", () => {
  const baseData: ContributorsData = {
    repos: [
      {
        repository: "owner/repo",
        isPrivate: false,
        contributors: [
          {
            login: "alice",
            avatarUrl: "https://example.com/alice.png",
            contributions: 100,
          },
          {
            login: "bob",
            avatarUrl: "https://example.com/bob.png",
            contributions: 50,
          },
        ],
      },
      {
        repository: "owner/other",
        isPrivate: false,
        contributors: [
          {
            login: "charlie",
            avatarUrl: "https://example.com/charlie.png",
            contributions: 30,
          },
        ],
      },
    ],
  };

  it("renders a section title", () => {
    const result = renderContributors(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text === "Contributors");
    assert.ok(title !== undefined);
  });

  it("renders repository names", () => {
    const result = renderContributors(baseData, {}, makeCtx());
    const repo1 = result.elements.find((el) => el.text === "owner/repo");
    const repo2 = result.elements.find((el) => el.text === "owner/other");
    assert.ok(repo1 !== undefined);
    assert.ok(repo2 !== undefined);
  });

  it("renders contributor avatar images", () => {
    const result = renderContributors(baseData, {}, makeCtx());
    const avatars = result.elements.filter(
      (el) =>
        el.tag === "image" &&
        typeof el.attrs.href === "string" &&
        el.attrs.href.includes("example.com"),
    );
    assert.strictEqual(avatars.length, 3);
  });

  it("shows empty message when no repos", () => {
    const emptyData: ContributorsData = { repos: [] };
    const result = renderContributors(emptyData, {}, makeCtx());
    const msg = result.elements.find((el) => el.text === "No contributor data");
    assert.ok(msg !== undefined);
  });

  it("computes positive height", () => {
    const result = renderContributors(baseData, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Topics renderer
// ---------------------------------------------------------------------------

import { renderTopics } from "../src/plugins/topics/render.ts";
import type { TopicsData } from "../src/plugins/topics/source.ts";

describe("Topics renderer", () => {
  it("returns empty for no topics", () => {
    const data: TopicsData = { topics: [] };
    const result = renderTopics(data, {}, makeCtx());
    assert.ok(result.height > 0, "Expected non-zero height for empty state");
    assert.ok(
      result.elements.length > 0,
      "Expected elements for empty state message",
    );
  });

  it("renders section title", () => {
    const data: TopicsData = { topics: [{ name: "typescript", count: 5 }] };
    const result = renderTopics(data, {}, makeCtx());
    const title = findTextsDeep(result.elements).find(
      (el) => el.text === "Topics",
    );
    assert.ok(title !== undefined);
  });

  it("renders topic pills", () => {
    const data: TopicsData = {
      topics: [
        { name: "typescript", count: 10 },
        { name: "rust", count: 3 },
      ],
    };
    const result = renderTopics(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("typescript")));
    assert.ok(allTexts.some((el) => el.text?.includes("rust")));
  });

  it("computes positive height", () => {
    const data: TopicsData = {
      topics: [{ name: "python", count: 1 }],
    };
    const result = renderTopics(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Licences renderer
// ---------------------------------------------------------------------------

import { renderLicences } from "../src/plugins/licenses/render.ts";
import type { LicencesData } from "../src/plugins/licenses/source.ts";

describe("Licences renderer", () => {
  it("returns empty for no data", () => {
    const data: LicencesData = { licences: [], totalRepos: 0, unlicensed: 0 };
    const result = renderLicences(data, {}, makeCtx());
    assert.ok(result.height > 0, "Expected non-zero height for empty state");
    assert.ok(
      result.elements.length > 0,
      "Expected elements for empty state message",
    );
  });

  it("renders section title", () => {
    const data: LicencesData = {
      licences: [{ spdxId: "MIT", name: "MIT License", count: 5 }],
      totalRepos: 5,
      unlicensed: 0,
    };
    const result = renderLicences(data, {}, makeCtx());
    const title = findTextsDeep(result.elements).find(
      (el) => el.text === "Licences",
    );
    assert.ok(title !== undefined);
  });

  it("renders licence labels", () => {
    const data: LicencesData = {
      licences: [
        { spdxId: "MIT", name: "MIT License", count: 10 },
        { spdxId: "Apache-2.0", name: "Apache License 2.0", count: 3 },
      ],
      totalRepos: 13,
      unlicensed: 0,
    };
    const result = renderLicences(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("MIT")));
    assert.ok(allTexts.some((el) => el.text?.includes("Apache")));
  });

  it("shows unlicensed repos", () => {
    const data: LicencesData = {
      licences: [],
      totalRepos: 5,
      unlicensed: 5,
    };
    const result = renderLicences(data, {}, makeCtx());
    const allTexts = findTextsDeep(result.elements);
    assert.ok(allTexts.some((el) => el.text?.includes("No licence")));
  });

  it("computes positive height", () => {
    const data: LicencesData = {
      licences: [{ spdxId: "MIT", name: "MIT License", count: 1 }],
      totalRepos: 1,
      unlicensed: 0,
    };
    const result = renderLicences(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});
