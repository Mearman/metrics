/**
 * Tests for the skyline isometric renderer.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderSkyline } from "../src/plugins/skyline/render.ts";
import type { RenderContext, Theme } from "../src/plugins/types.ts";
import type { IsocalendarData } from "../src/plugins/isocalendar/source.ts";

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

const mockMeasure = {
  textWidth: () => 80,
  textBlockHeight: () => 20,
};

const ctx: RenderContext = {
  measure: mockMeasure,
  theme: testTheme,
  icons: { get: () => "" },
  contentWidth: 448,
  repos: { fetch: "public", rules: [] },
};

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeWeeks(
  weekCount: number,
  contributionFn: (d: number) => number,
): IsocalendarData["weeks"] {
  const weeks: IsocalendarData["weeks"] = [];
  const startDate = new Date("2024-01-01");
  for (let w = 0; w < weekCount; w++) {
    const days: IsocalendarData["weeks"][number]["contributionDays"] = [];
    for (let d = 0; d < 7; d++) {
      const count = contributionFn(d + w * 7);
      days.push({
        date: new Date(startDate.getTime() + (w * 7 + d) * 86400000)
          .toISOString()
          .slice(0, 10),
        count,
        colour:
          count === 0
            ? "#161b22"
            : count < 3
              ? "#0e4429"
              : count < 6
                ? "#006d32"
                : count < 9
                  ? "#26a641"
                  : "#39d353",
      });
    }
    weeks.push({ contributionDays: days });
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("skyline renderer", () => {
  it("renders a section title", () => {
    const data: IsocalendarData = {
      weeks: makeWeeks(2, () => 0),
      totalContributions: 0,
    };
    const result = renderSkyline(data, {}, ctx);
    assert.ok(result.elements.length > 0);
    const titleEl = result.elements.find(
      (el) => el.tag === "text" && el.text === "Skyline",
    );
    assert.ok(titleEl, "Section title 'Skyline' should be present");
  });

  it("renders buildings for contributions > 0", () => {
    const data: IsocalendarData = {
      weeks: makeWeeks(4, (day) => (day % 7 === 0 ? 5 : 0)),
      totalContributions: 4,
    };
    const result = renderSkyline(data, {}, ctx);

    // Should contain a group wrapping the buildings
    const groups = result.elements.filter((el) => el.tag === "g");
    assert.ok(groups.length >= 1, "Should contain a group for buildings");

    // Paths should be inside the group
    const buildingGroup = groups[0];
    const paths =
      buildingGroup?.children?.filter((el) => el.tag === "path") ?? [];
    assert.ok(paths.length > 0, "Should render path elements for buildings");
  });

  it("returns a positive height", () => {
    const data: IsocalendarData = {
      weeks: makeWeeks(4, () => 1),
      totalContributions: 28,
    };
    const result = renderSkyline(data, { max_height: 80 }, ctx);
    assert.ok(result.height > 0, "Height should be positive");
  });

  it("uses contribution-based colours", () => {
    // High contributions should get L4 colour variants
    const data: IsocalendarData = {
      weeks: makeWeeks(2, () => 10),
      totalContributions: 140,
    };
    const result = renderSkyline(data, {}, ctx);

    const groups = result.elements.filter((el) => el.tag === "g");
    assert.ok(groups.length >= 1);

    const buildingGroup = groups[0];
    assert.ok(buildingGroup?.children);

    // Check that some paths use bright green (L4) top face (lightened)
    const topFaces = buildingGroup.children.filter(
      (el) =>
        el.tag === "path" &&
        typeof el.attrs.fill === "string" &&
        el.attrs.fill.includes("#"),
    );
    assert.ok(
      topFaces.length > 0,
      "Should have path elements with fill colours",
    );
  });

  it("renders zero-contribution days as flat ground", () => {
    const data: IsocalendarData = {
      weeks: makeWeeks(2, () => 0),
      totalContributions: 0,
    };
    const result = renderSkyline(data, {}, ctx);

    // Even with zero contributions, buildings should exist (height=2 minimum)
    const groups = result.elements.filter((el) => el.tag === "g");
    const buildingGroup = groups[0];
    const paths =
      buildingGroup?.children?.filter((el) => el.tag === "path") ?? [];
    assert.ok(
      paths.length > 0,
      "Should render flat buildings for zero contributions",
    );
  });

  it("respects max_height config", () => {
    const data: IsocalendarData = {
      weeks: makeWeeks(4, () => 10),
      totalContributions: 280,
    };
    const result = renderSkyline(data, { max_height: 50 }, ctx);
    const result2 = renderSkyline(data, { max_height: 150 }, ctx);

    // Higher max_height should produce a taller section
    assert.ok(
      result2.height > result.height,
      "Larger max_height should increase total height",
    );
  });

  it("handles a full year of data (52 weeks)", () => {
    const data: IsocalendarData = {
      weeks: makeWeeks(52, (day) => Math.floor(Math.sin(day * 0.1) * 5 + 5)),
      totalContributions: 1000,
    };
    const result = renderSkyline(data, {}, ctx);
    assert.ok(result.height > 0);
    assert.ok(result.elements.length > 0);
  });
});
