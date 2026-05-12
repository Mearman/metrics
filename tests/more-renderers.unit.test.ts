/**
 * Tests for remaining renderer functions.
 *
 * Covers followup, stars, stargazers, habits, achievements,
 * activity, people, and notable renderers.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderFollowup } from "../src/plugins/followup/render.ts";
import { renderStars } from "../src/plugins/stars/render.ts";
import { renderStargazers } from "../src/plugins/stargazers/render.ts";
import { renderHabits } from "../src/plugins/habits/render.ts";
import { renderAchievements } from "../src/plugins/achievements/render.ts";
import { renderActivity } from "../src/plugins/activity/render.ts";
import { renderPeople } from "../src/plugins/people/render.ts";
import { renderNotable } from "../src/plugins/notable/render.ts";
import type { RenderContext, Theme } from "../src/plugins/types.ts";
import type { FollowupData } from "../src/plugins/followup/source.ts";
import type { StarsData } from "../src/plugins/stars/source.ts";
import type { StargazersData } from "../src/plugins/stargazers/source.ts";
import type { HabitsData } from "../src/plugins/habits/source.ts";
import type { AchievementsData } from "../src/plugins/achievements/source.ts";
import type { ActivityData } from "../src/plugins/activity/source.ts";
import type { PeopleData } from "../src/plugins/people/source.ts";
import type { NotableData } from "../src/plugins/notable/source.ts";

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

// ---------------------------------------------------------------------------
// Followup renderer
// ---------------------------------------------------------------------------

describe("Followup renderer", () => {
  it("returns empty result for no sections", () => {
    const data: FollowupData = { sections: [] };
    const result = renderFollowup(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
    assert.strictEqual(result.elements.length, 0);
  });

  it("renders a section title", () => {
    const data: FollowupData = {
      sections: [
        {
          title: "Test",
          issues: { open: 1, closed: 5 },
          pullRequests: { open: 2, merged: 3, closed: 1 },
        },
      ],
    };
    const result = renderFollowup(data, {}, makeCtx());
    const title = result.elements.find((el) => el.text === "Follow-up");
    assert.ok(title !== undefined);
  });

  it("renders progress bars for issues", () => {
    const data: FollowupData = {
      sections: [
        {
          title: "Test",
          issues: { open: 2, closed: 8 },
          pullRequests: { open: 0, merged: 0, closed: 0 },
        },
      ],
    };
    const result = renderFollowup(data, {}, makeCtx());
    const openLabel = result.elements.find((el) => el.text?.includes("2 open"));
    assert.ok(openLabel !== undefined);
  });

  it("renders merged/closed PR bars", () => {
    const data: FollowupData = {
      sections: [
        {
          title: "Test",
          issues: { open: 0, closed: 0 },
          pullRequests: { open: 5, merged: 10, closed: 3 },
        },
      ],
    };
    const result = renderFollowup(data, {}, makeCtx());
    const prLabel = result.elements.find((el) => el.text?.includes("merged"));
    assert.ok(prLabel !== undefined);
  });

  it("computes positive height", () => {
    const data: FollowupData = {
      sections: [
        {
          title: "Test",
          issues: { open: 1, closed: 1 },
          pullRequests: { open: 1, merged: 1, closed: 0 },
        },
      ],
    };
    const result = renderFollowup(data, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Stars renderer
// ---------------------------------------------------------------------------

describe("Stars renderer", () => {
  const baseData: StarsData = {
    repositories: [
      {
        nameWithOwner: "user/repo",
        description: "A great project",
        stargazerCount: 100,
        forkCount: 5,
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
        starredAt: "2025-05-10",
      },
    ],
  };

  it("returns empty for no repositories", () => {
    const data: StarsData = { repositories: [] };
    const result = renderStars(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
  });

  it("renders section title", () => {
    const result = renderStars(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text?.includes("starred"));
    assert.ok(title !== undefined);
  });

  it("renders repo name", () => {
    const result = renderStars(baseData, {}, makeCtx());
    const name = result.elements.find((el) => el.text?.includes("user/repo"));
    assert.ok(name !== undefined);
  });

  it("renders language colour dot", () => {
    const result = renderStars(baseData, {}, makeCtx());
    const dot = result.elements.find(
      (el) => el.tag === "rect" && el.attrs.fill === "#3178c6",
    );
    assert.ok(dot !== undefined);
  });

  it("handles missing description and language", () => {
    const noDesc: StarsData = {
      repositories: [
        {
          nameWithOwner: "user/repo",
          description: null,
          stargazerCount: 50,
          forkCount: 0,
          primaryLanguage: null,
          starredAt: "2025-05-09",
        },
      ],
    };
    const result = renderStars(noDesc, {}, makeCtx());
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Stargazers renderer
// ---------------------------------------------------------------------------

describe("Stargazers renderer", () => {
  const baseData: StargazersData = {
    totalStars: 50,
    repos: [
      { name: "repo-a", stars: 30, isPrivate: false },
      { name: "repo-b", stars: 20, isPrivate: false },
    ],
  };

  it("returns empty for no repos", () => {
    const data: StargazersData = { totalStars: 0, repos: [] };
    const result = renderStargazers(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
  });

  it("renders total star count in title", () => {
    const result = renderStargazers(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text?.includes("50"));
    assert.ok(title !== undefined);
  });

  it("renders bar chart bars", () => {
    const result = renderStargazers(baseData, {}, makeCtx());
    const bars = result.elements.filter(
      (el) => el.tag === "rect" && el.attrs.fill === "#e3b341",
    );
    assert.strictEqual(bars.length, 2);
  });

  it("renders repo names as labels", () => {
    const result = renderStargazers(baseData, {}, makeCtx());
    const nameA = result.elements.find((el) => el.text === "repo-a");
    const nameB = result.elements.find((el) => el.text === "repo-b");
    assert.ok(nameA !== undefined);
    assert.ok(nameB !== undefined);
  });

  it("filters private repos when action is count", () => {
    const data: StargazersData = {
      totalStars: 100,
      repos: [
        { name: "public-repo", stars: 40, isPrivate: false },
        { name: "private-repo", stars: 60, isPrivate: true },
      ],
    };
    const ctx = makeCtx({
      repos: {
        fetch: "all",
        rules: [{ match: { visibility: "private" }, action: "count" }],
      },
    });
    const result = renderStargazers(data, {}, ctx);
    // Public repo should be named
    const publicName = result.elements.find((el) => el.text === "public-repo");
    assert.ok(publicName !== undefined, "public repo should be named");
    // Private repo should NOT be named
    const privateName = result.elements.find(
      (el) => el.text === "private-repo",
    );
    assert.strictEqual(
      privateName,
      undefined,
      "private repo should not be named",
    );
    // Only one bar (for the public repo)
    const bars = result.elements.filter(
      (el) => el.tag === "rect" && el.attrs.fill === "#e3b341",
    );
    assert.strictEqual(bars.length, 1, "should render only one bar");
  });
});

describe("Habits renderer", () => {
  const baseData: HabitsData = {
    totalCommits: 215,
    days: [],
    busiestDay: "2025-05-06",
    busiestDayCount: 368,
    avgPerDay: 14.3,
    streak: 15,
    hourly: [],
    weekdays: [
      { day: "Sunday", count: 10 },
      { day: "Monday", count: 50 },
      { day: "Tuesday", count: 30 },
      { day: "Wednesday", count: 25 },
      { day: "Thursday", count: 40 },
      { day: "Friday", count: 35 },
      { day: "Saturday", count: 15 },
    ],
    facts: [
      { label: "Busiest day", value: "Mondays" },
      { label: "Average per day", value: "14.3 commits" },
      { label: "Current streak", value: "15 days" },
      { label: "Busiest single day", value: "368 commits" },
      { label: "Total commits", value: "215" },
    ],
  };

  it("renders section title", () => {
    const result = renderHabits(
      baseData,
      { charts: false, facts: true },
      makeCtx(),
    );
    const title = result.elements.find((el) => el.text?.includes("habits"));
    assert.ok(title !== undefined);
  });

  it("renders commit count stat", () => {
    const result = renderHabits(
      baseData,
      { charts: false, facts: true },
      makeCtx(),
    );
    const stat = result.elements.find((el) => el.text?.includes("215"));
    assert.ok(stat !== undefined);
  });

  it("renders streak info", () => {
    const result = renderHabits(
      baseData,
      { charts: false, facts: true },
      makeCtx(),
    );
    const stat = result.elements.find((el) => el.text?.includes("streak"));
    assert.ok(stat !== undefined);
  });

  it("computes positive height", () => {
    const result = renderHabits(
      baseData,
      { charts: false, facts: true },
      makeCtx(),
    );
    assert.ok(result.height > 0);
  });
});

// ---------------------------------------------------------------------------
// Achievements renderer
// ---------------------------------------------------------------------------

describe("Achievements renderer", () => {
  const baseData: AchievementsData = {
    stats: {
      followers: 65,
      following: 47,
      publicRepos: 202,
      gists: 34,
      issues: 363,
      pullRequests: 755,
      totalCommits: 17050,
      starred: 1543,
      watching: 10,
    },
    achievements: [
      {
        id: "10k-commits",
        title: "10K Commits",
        description: "17050 total commits",
        icon: "git-commit",
        tier: "X",
      },
      {
        id: "star-gazer",
        title: "Star Gazer",
        description: "1543 starred repos",
        icon: "star",
        tier: "S",
      },
    ],
  };

  it("renders section title", () => {
    const result = renderAchievements(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text === "Achievements");
    assert.ok(title !== undefined);
  });

  it("renders achievement titles", () => {
    const result = renderAchievements(baseData, {}, makeCtx());
    const a1 = result.elements.find((el) => el.text === "10K Commits");
    const a2 = result.elements.find((el) => el.text === "Star Gazer");
    assert.ok(a1 !== undefined);
    assert.ok(a2 !== undefined);
  });

  it("renders tier badges", () => {
    const result = renderAchievements(baseData, {}, makeCtx());
    const tierX = result.elements.find((el) => el.text === "X");
    const tierS = result.elements.find((el) => el.text === "S");
    assert.ok(tierX !== undefined);
    assert.ok(tierS !== undefined);
  });

  it("renders description text", () => {
    const result = renderAchievements(baseData, {}, makeCtx());
    const detail = result.elements.find((el) => el.text?.includes("17050"));
    assert.ok(detail !== undefined);
  });

  it("handles empty achievements", () => {
    const data: AchievementsData = {
      stats: {
        followers: 0,
        following: 0,
        publicRepos: 0,
        gists: 0,
        issues: 0,
        pullRequests: 0,
        totalCommits: 0,
        starred: 0,
        watching: 0,
      },
      achievements: [],
    };
    const result = renderAchievements(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
  });
});

// ---------------------------------------------------------------------------
// Activity renderer
// ---------------------------------------------------------------------------

describe("Activity renderer", () => {
  const baseData: ActivityData = {
    events: [
      {
        type: "push",
        repo: "user/repo-a",
        timestamp: new Date("2025-05-10"),
        description: "Pushed to main",
      },
      {
        type: "issue",
        repo: "user/repo-b",
        timestamp: new Date("2025-05-09"),
        description: "Opened issue #1",
      },
    ],
    timestamps: false,
  };

  it("renders section title", () => {
    const result = renderActivity(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text?.includes("activity"));
    assert.ok(title !== undefined);
  });

  it("renders event descriptions", () => {
    const result = renderActivity(baseData, {}, makeCtx());
    const push = result.elements.find((el) => el.text?.includes("Pushed"));
    assert.ok(push !== undefined);
  });

  it("renders repo names", () => {
    const result = renderActivity(baseData, {}, makeCtx());
    const repo = result.elements.find((el) => el.text?.includes("repo-a"));
    assert.ok(repo !== undefined);
  });

  it("returns empty for no events", () => {
    const data: ActivityData = { events: [], timestamps: false };
    const result = renderActivity(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
    assert.strictEqual(result.elements.length, 0);
  });
});

// ---------------------------------------------------------------------------
// People renderer
// ---------------------------------------------------------------------------

describe("People renderer", () => {
  const baseData: PeopleData = {
    sections: [
      {
        type: "followers",
        totalCount: 65,
        people: [
          { login: "alice", avatarUrl: "https://example.com/alice.png" },
          { login: "bob", avatarUrl: "https://example.com/bob.png" },
        ],
      },
    ],
  };

  it("renders section title with count", () => {
    const result = renderPeople(
      baseData,
      { limit: 20, size: 28, types: ["followers"] },
      makeCtx(),
    );
    const title = result.elements.find((el) => el.text?.includes("65"));
    assert.ok(title !== undefined);
  });

  it("renders avatar images", () => {
    const result = renderPeople(
      baseData,
      { limit: 20, size: 28, types: ["followers"] },
      makeCtx(),
    );
    // Avatars are nested inside <g> elements — check children
    const group = result.elements.find(
      (el) => el.tag === "g" && el.children !== undefined,
    );
    assert.ok(group !== undefined);
    const images = group.children?.filter((el) => el.tag === "image") ?? [];
    assert.strictEqual(images.length, 2);
  });

  it("returns empty for no sections", () => {
    const data: PeopleData = { sections: [] };
    const result = renderPeople(
      data,
      { limit: 20, size: 28, types: ["followers"] },
      makeCtx(),
    );
    assert.strictEqual(result.height, 0);
  });
});

// ---------------------------------------------------------------------------
// Notable renderer
// ---------------------------------------------------------------------------

describe("Notable renderer", () => {
  const baseData: NotableData = {
    contributions: [
      {
        name: "Acme",
        avatarUrl: "https://example.com/acme.png",
        url: "https://github.com/acme",
      },
      {
        name: "Globex",
        avatarUrl: "https://example.com/globex.png",
        url: "https://github.com/globex",
      },
    ],
  };

  it("renders section title", () => {
    const result = renderNotable(baseData, {}, makeCtx());
    const title = result.elements.find((el) => el.text?.includes("Notable"));
    assert.ok(title !== undefined);
  });

  it("renders organisation avatars", () => {
    const result = renderNotable(baseData, {}, makeCtx());
    // Avatars are nested inside <g> elements
    const group = result.elements.find(
      (el) => el.tag === "g" && el.children !== undefined,
    );
    assert.ok(group !== undefined);
    const images = group.children?.filter((el) => el.tag === "image") ?? [];
    assert.strictEqual(images.length, 2);
  });

  it("returns empty for no contributions", () => {
    const data: NotableData = { contributions: [] };
    const result = renderNotable(data, {}, makeCtx());
    assert.strictEqual(result.height, 0);
  });
});
