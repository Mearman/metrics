/**
 * Tests for expanded plugin config options.
 *
 * Each test verifies that new config options are correctly parsed
 * and applied by the Zod schemas and transform functions.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

import { LanguagesConfig } from "../src/plugins/languages/source.ts";

describe("Languages config", () => {
  it("applies defaults", () => {
    const parsed = LanguagesConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.limit, 8);
    assert.strictEqual(parsed.data.threshold, 1);
    assert.deepStrictEqual(parsed.data.ignored, []);
    assert.strictEqual(parsed.data.other, false);
    assert.deepStrictEqual(parsed.data.colors, {});
    assert.deepStrictEqual(parsed.data.aliases, {});
    assert.deepStrictEqual(parsed.data.details, []);
  });

  it("parses all options", () => {
    const parsed = LanguagesConfig.safeParse({
      limit: 5,
      threshold: 3,
      ignored: ["html", "css"],
      other: true,
      colors: { javascript: "red" },
      aliases: { typescript: "TS" },
      details: ["bytes-size", "percentage"],
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.limit, 5);
    assert.deepStrictEqual(parsed.data.ignored, ["html", "css"]);
    assert.strictEqual(parsed.data.other, true);
    assert.deepStrictEqual(parsed.data.colors, { javascript: "red" });
    assert.deepStrictEqual(parsed.data.details, ["bytes-size", "percentage"]);
  });
});

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

import { HabitsConfig } from "../src/plugins/habits/source.ts";

describe("Habits config", () => {
  it("applies defaults", () => {
    const parsed = HabitsConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.days, 14);
    assert.strictEqual(parsed.data.charts, false);
    assert.strictEqual(parsed.data.facts, true);
    assert.strictEqual(parsed.data.from, 200);
    assert.strictEqual(parsed.data.trim, false);
    assert.strictEqual(parsed.data.languages_limit, 8);
  });

  it("parses all options", () => {
    const parsed = HabitsConfig.safeParse({
      days: 30,
      charts: true,
      facts: false,
      from: 500,
      trim: true,
      languages_limit: 4,
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.days, 30);
    assert.strictEqual(parsed.data.charts, true);
    assert.strictEqual(parsed.data.facts, false);
    assert.strictEqual(parsed.data.from, 500);
    assert.strictEqual(parsed.data.trim, true);
    assert.strictEqual(parsed.data.languages_limit, 4);
  });
});

// ---------------------------------------------------------------------------
// Activity
// ---------------------------------------------------------------------------

import { ActivityConfig } from "../src/plugins/activity/source.ts";

describe("Activity config", () => {
  it("applies defaults including ignored", () => {
    const parsed = ActivityConfig.safeParse({});
    assert.ok(parsed.success);
    assert.deepStrictEqual(parsed.data.ignored, []);
    assert.strictEqual(parsed.data.limit, 5);
    assert.strictEqual(parsed.data.days, 14);
  });

  it("parses ignored users", () => {
    const parsed = ActivityConfig.safeParse({
      ignored: ["dependabot[bot]", "renovate-bot"],
    });
    assert.ok(parsed.success);
    assert.deepStrictEqual(parsed.data.ignored, [
      "dependabot[bot]",
      "renovate-bot",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

import { RepositoriesConfig } from "../src/plugins/repositories/source.ts";

describe("Repositories config", () => {
  it("applies defaults including forks", () => {
    const parsed = RepositoriesConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.forks, false);
    assert.strictEqual(parsed.data.pinned, 0);
    assert.deepStrictEqual(parsed.data.featured, []);
  });

  it("parses forks option", () => {
    const parsed = RepositoriesConfig.safeParse({ forks: true });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.forks, true);
  });
});

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

import { AchievementsPluginConfig } from "../src/plugins/achievements/plugin.ts";

describe("Achievements config", () => {
  it("applies defaults including limit and ignored", () => {
    const parsed = AchievementsPluginConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.threshold, "C");
    assert.strictEqual(parsed.data.display, "detailed");
    assert.strictEqual(parsed.data.limit, 0);
    assert.deepStrictEqual(parsed.data.ignored, []);
  });

  it("parses limit and ignored", () => {
    const parsed = AchievementsPluginConfig.safeParse({
      threshold: "A",
      limit: 5,
      ignored: ["commits-10k"],
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.threshold, "A");
    assert.strictEqual(parsed.data.limit, 5);
    assert.deepStrictEqual(parsed.data.ignored, ["commits-10k"]);
  });
});

// ---------------------------------------------------------------------------
// Stargazers
// ---------------------------------------------------------------------------

import { StargazersConfig } from "../src/plugins/stargazers/source.ts";

describe("Stargazers config", () => {
  it("applies defaults including days", () => {
    const parsed = StargazersConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.limit, 8);
    assert.strictEqual(parsed.data.days, 14);
  });
});

// ---------------------------------------------------------------------------
// Followup
// ---------------------------------------------------------------------------

import { FollowupConfig } from "../src/plugins/followup/source.ts";

describe("Followup config", () => {
  it("applies defaults including archived", () => {
    const parsed = FollowupConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.archived, true);
    assert.deepStrictEqual(parsed.data.sections, ["repositories"]);
  });
});

// ---------------------------------------------------------------------------
// Code
// ---------------------------------------------------------------------------

import { CodeConfig } from "../src/plugins/code/source.ts";

describe("Code config", () => {
  it("applies defaults including days, languages, visibility", () => {
    const parsed = CodeConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.days, 3);
    assert.deepStrictEqual(parsed.data.languages, []);
    assert.strictEqual(parsed.data.visibility, "public");
  });

  it("parses all options", () => {
    const parsed = CodeConfig.safeParse({
      days: 7,
      languages: ["typescript", "python"],
      visibility: "all",
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.days, 7);
    assert.deepStrictEqual(parsed.data.languages, ["typescript", "python"]);
    assert.strictEqual(parsed.data.visibility, "all");
  });
});

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

import { ReactionsConfig } from "../src/plugins/reactions/source.ts";

describe("Reactions config", () => {
  it("applies defaults including display, details, ignored", () => {
    const parsed = ReactionsConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.display, "absolute");
    assert.deepStrictEqual(parsed.data.details, []);
    assert.deepStrictEqual(parsed.data.ignored, []);
  });

  it("parses display and details", () => {
    const parsed = ReactionsConfig.safeParse({
      display: "relative",
      details: ["count", "percentage"],
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.display, "relative");
    assert.deepStrictEqual(parsed.data.details, ["count", "percentage"]);
  });
});

// ---------------------------------------------------------------------------
// Notable
// ---------------------------------------------------------------------------

import { NotableConfig } from "../src/plugins/notable/source.ts";

describe("Notable config", () => {
  it("applies defaults including types, self, contribution_types", () => {
    const parsed = NotableConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.types, "organization");
    assert.strictEqual(parsed.data.self, false);
    assert.deepStrictEqual(parsed.data.contribution_types, ["commit"]);
  });

  it("parses contribution_types", () => {
    const parsed = NotableConfig.safeParse({
      types: "all",
      self: true,
      contribution_types: ["commit", "pull_request", "issue"],
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.types, "all");
    assert.strictEqual(parsed.data.self, true);
    assert.deepStrictEqual(parsed.data.contribution_types, [
      "commit",
      "pull_request",
      "issue",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

import { ProjectsConfig } from "../src/plugins/projects/source.ts";

describe("Projects config", () => {
  it("applies defaults including descriptions", () => {
    const parsed = ProjectsConfig.safeParse({});
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.descriptions, false);
    assert.strictEqual(parsed.data.limit, 6);
  });
});

// ---------------------------------------------------------------------------
// Contributors
// ---------------------------------------------------------------------------

import { ContributorsConfig } from "../src/plugins/contributors/source.ts";

describe("Contributors config", () => {
  it("applies defaults including ignored", () => {
    const parsed = ContributorsConfig.safeParse({});
    assert.ok(parsed.success);
    assert.deepStrictEqual(parsed.data.ignored, []);
  });
});

// ---------------------------------------------------------------------------
// RSS
// ---------------------------------------------------------------------------

import { RssConfig } from "../src/plugins/rss/source.ts";

describe("RSS config", () => {
  it("requires source URL", () => {
    const parsed = RssConfig.safeParse({});
    assert.ok(!parsed.success);
  });

  it("parses valid config", () => {
    const parsed = RssConfig.safeParse({
      source: "https://example.com/feed.xml",
      limit: 10,
    });
    assert.ok(parsed.success);
    assert.strictEqual(parsed.data.source, "https://example.com/feed.xml");
    assert.strictEqual(parsed.data.limit, 10);
  });
});

// ---------------------------------------------------------------------------
// Root config
// ---------------------------------------------------------------------------

import { RootConfig } from "../src/config/schema.ts";

describe("Root config", () => {
  it("applies defaults including users_ignored", () => {
    const parsed = RootConfig.safeParse({
      outputs: [{ path: "test.svg", plugins: { base: {} } }],
    });
    assert.ok(parsed.success);
    assert.deepStrictEqual(parsed.data.users_ignored, []);
  });

  it("parses users_ignored", () => {
    const parsed = RootConfig.safeParse({
      users_ignored: ["bot1", "bot2"],
      outputs: [{ path: "test.svg", plugins: { base: {} } }],
    });
    assert.ok(parsed.success);
    assert.deepStrictEqual(parsed.data.users_ignored, ["bot1", "bot2"]);
  });
});
