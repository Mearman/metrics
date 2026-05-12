/**
 * Tests for the repository filtering engine.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveAction,
  shouldFetch,
  shouldEnumerate,
  isExcluded,
  type RepoProperties,
} from "../src/repos/filter.ts";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const publicRepo: RepoProperties = {
  name: "Mearman/metrics",
  isPrivate: false,
  owner: "Mearman",
  topics: ["typescript", "svg"],
  language: "TypeScript",
};

const privateRepo: RepoProperties = {
  name: "Mearman/secret-project",
  isPrivate: true,
  owner: "Mearman",
  topics: ["python", "machine-learning"],
  language: "Python",
};

const orgRepo: RepoProperties = {
  name: "ExaDev/some-tool",
  isPrivate: false,
  owner: "ExaDev",
  topics: ["rust", "cli"],
  language: "Rust",
};

const privateOrgRepo: RepoProperties = {
  name: "SecretOrg/hidden-tool",
  isPrivate: true,
  owner: "SecretOrg",
  topics: ["go", "internal"],
  language: "Go",
};

// ---------------------------------------------------------------------------
// Default behaviour (no rules)
// ---------------------------------------------------------------------------

describe("Default behaviour (no rules)", () => {
  it("includes public repos by default", () => {
    assert.strictEqual(resolveAction(publicRepo, []), "include");
  });

  it("counts (not includes) private repos by default", () => {
    assert.strictEqual(resolveAction(privateRepo, []), "count");
  });
});

// ---------------------------------------------------------------------------
// Glob matching
// ---------------------------------------------------------------------------

describe("Glob matching", () => {
  it("matches repos by glob pattern", () => {
    const rules = [{ match: "Mearman/*", action: "include" as const }];
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
    assert.strictEqual(resolveAction(privateRepo, rules), "include");
  });

  it("excludes repos matching glob", () => {
    const rules = [{ match: "Mearman/secret-*", action: "exclude" as const }];
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
    assert.strictEqual(resolveAction(privateRepo, rules), "exclude");
  });

  it("matches org repos with wildcard", () => {
    const rules = [{ match: "ExaDev/*", action: "count" as const }];
    assert.strictEqual(resolveAction(orgRepo, rules), "count");
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
  });
});

// ---------------------------------------------------------------------------
// Regex matching
// ---------------------------------------------------------------------------

describe("Regex matching", () => {
  it("matches repos by regex pattern", () => {
    const rules = [{ match: "/.*-project$/", action: "exclude" as const }];
    assert.strictEqual(resolveAction(privateRepo, rules), "exclude");
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
  });

  it("matches complex regex", () => {
    const rules = [
      { match: "/^(Mearman|ExaDev)\\//", action: "include" as const },
    ];
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
    assert.strictEqual(resolveAction(orgRepo, rules), "include");
    assert.strictEqual(resolveAction(privateOrgRepo, rules), "count");
  });
});

// ---------------------------------------------------------------------------
// Property matching
// ---------------------------------------------------------------------------

describe("Property matching", () => {
  it("matches by visibility", () => {
    const rules = [
      { match: { visibility: "private" as const }, action: "exclude" as const },
    ];
    assert.strictEqual(resolveAction(privateRepo, rules), "exclude");
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
  });

  it("matches by org", () => {
    const rules = [{ match: { org: "SecretOrg" }, action: "exclude" as const }];
    assert.strictEqual(resolveAction(privateOrgRepo, rules), "exclude");
    assert.strictEqual(resolveAction(orgRepo, rules), "include");
  });

  it("matches by topic", () => {
    const rules = [
      { match: { topic: "machine-learning" }, action: "count" as const },
    ];
    assert.strictEqual(resolveAction(privateRepo, rules), "count");
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
  });

  it("matches by language (case-insensitive)", () => {
    const rules = [
      { match: { lang: "typescript" }, action: "include" as const },
    ];
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
    assert.strictEqual(resolveAction(privateRepo, rules), "count");
  });

  it("ANDs multiple properties", () => {
    const rules = [
      {
        match: { visibility: "private" as const, org: "Mearman" },
        action: "count" as const,
      },
    ];
    assert.strictEqual(resolveAction(privateRepo, rules), "count");
    assert.strictEqual(resolveAction(privateOrgRepo, rules), "count");
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
  });
});

// ---------------------------------------------------------------------------
// Rule ordering (first match wins)
// ---------------------------------------------------------------------------

describe("Rule ordering", () => {
  it("first matching rule wins", () => {
    const rules = [
      { match: "Mearman/*", action: "include" as const },
      { match: "Mearman/secret-*", action: "exclude" as const },
    ];
    // First rule matches, so secret-project is included
    assert.strictEqual(resolveAction(privateRepo, rules), "include");
  });

  it("falls through to later rules", () => {
    const rules = [
      { match: "ExaDev/*", action: "exclude" as const },
      { match: "Mearman/secret-*", action: "count" as const },
    ];
    assert.strictEqual(resolveAction(privateRepo, rules), "count");
    assert.strictEqual(resolveAction(orgRepo, rules), "exclude");
    assert.strictEqual(resolveAction(publicRepo, rules), "include");
  });
});

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

describe("shouldFetch", () => {
  it("fetches public repos in public mode", () => {
    assert.strictEqual(shouldFetch(publicRepo, "public"), true);
    assert.strictEqual(shouldFetch(privateRepo, "public"), false);
  });

  it("fetches all repos in all mode", () => {
    assert.strictEqual(shouldFetch(publicRepo, "all"), true);
    assert.strictEqual(shouldFetch(privateRepo, "all"), true);
  });
});

describe("shouldEnumerate", () => {
  it("enumerates included repos", () => {
    assert.strictEqual(shouldEnumerate(publicRepo, []), true);
  });

  it("does not enumerate counted repos", () => {
    assert.strictEqual(shouldEnumerate(privateRepo, []), false);
  });

  it("does not enumerate excluded repos", () => {
    const rules = [{ match: "Mearman/*", action: "exclude" as const }];
    assert.strictEqual(shouldEnumerate(publicRepo, rules), false);
  });
});

describe("isExcluded", () => {
  it("excluded repos return true", () => {
    const rules = [{ match: "Mearman/*", action: "exclude" as const }];
    assert.strictEqual(isExcluded(publicRepo, rules), true);
  });

  it("non-excluded repos return false", () => {
    assert.strictEqual(isExcluded(publicRepo, []), false);
    assert.strictEqual(isExcluded(privateRepo, []), false);
  });
});
