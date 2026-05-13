import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMockData } from "../src/plugins/mock-registry.ts";

describe("mock data registry", () => {
  it("provides mock data for all 29 plugins", () => {
    const expected = [
      "base",
      "isocalendar",
      "languages",
      "habits",
      "achievements",
      "lines",
      "repositories",
      "activity",
      "stars",
      "followup",
      "stargazers",
      "people",
      "gists",
      "discussions",
      "notable",
      "calendar",
      "introduction",
      "reactions",
      "contributors",
      "code",
      "topics",
      "licenses",
      "loc",
      "projects",
      "sponsors",
      "sponsorships",
      "traffic",
      "skyline",
      "rss",
    ];
    for (const id of expected) {
      const data = getMockData(id);
      assert.notEqual(data, undefined, `Mock data missing for "${id}"`);
    }
  });

  it("returns undefined for unknown plugin IDs", () => {
    assert.equal(getMockData("nonexistent"), undefined);
  });

  it("provides realistic base mock data", () => {
    const data = getMockData("base") as Record<string, unknown>;
    assert.equal(data.login, "octocat");
    assert.equal(typeof data.followers, "number");
    assert.equal(typeof data.publicRepositories, "number");
    assert.equal(typeof data.totalCommits, "number");
  });

  it("provides realistic languages mock data", () => {
    const data = getMockData("languages") as Record<string, unknown>;
    assert.ok(Array.isArray(data.total));
    assert.ok((data.total as unknown[]).length > 0);
    assert.equal(typeof data.totalBytes, "number");
    assert.equal(typeof data.otherBytes, "number");
  });
});
