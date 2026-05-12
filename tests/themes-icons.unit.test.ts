/**
 * Tests for the theme system and icon lookup.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveTheme,
  classic,
  light,
  terminal,
} from "../src/render/template/themes.ts";
import { createIconLookup } from "../src/render/svg/icons.ts";

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------

describe("Theme resolution", () => {
  it("resolves 'classic' theme", () => {
    const theme = resolveTheme("classic");
    assert.strictEqual(theme.width, 480);
    assert.strictEqual(theme.colours.background, "#0d1117");
  });

  it("resolves 'light' theme", () => {
    const theme = resolveTheme("light");
    assert.strictEqual(theme.colours.background, "#ffffff");
  });

  it("resolves 'terminal' theme", () => {
    const theme = resolveTheme("terminal");
    assert.strictEqual(theme.colours.text, "#33ff33");
    assert.ok(theme.fontStack.includes("monospace"));
  });

  it("throws for unknown theme name", () => {
    assert.throws(
      () => resolveTheme("nonexistent"),
      /Unknown theme "nonexistent"/,
    );
  });

  it("all themes have consistent structure", () => {
    const themes = [classic, light, terminal];
    for (const theme of themes) {
      assert.strictEqual(typeof theme.width, "number");
      assert.strictEqual(typeof theme.sectionPadding, "number");
      assert.strictEqual(typeof theme.margin, "number");
      assert.strictEqual(typeof theme.fontStack, "string");
      assert.strictEqual(typeof theme.colours.text, "string");
      assert.strictEqual(typeof theme.colours.textSecondary, "string");
      assert.strictEqual(typeof theme.colours.textTertiary, "string");
      assert.strictEqual(typeof theme.colours.accent, "string");
      assert.strictEqual(typeof theme.colours.background, "string");
      assert.strictEqual(typeof theme.colours.border, "string");
      // Calendar levels
      assert.strictEqual(typeof theme.colours.calendar.L0, "string");
      assert.strictEqual(typeof theme.colours.calendar.L4, "string");
    }
  });

  it("all themes have non-zero width and padding", () => {
    const themes = [classic, light, terminal];
    for (const theme of themes) {
      assert.ok(theme.width > 0);
      assert.ok(theme.sectionPadding > 0);
      assert.ok(theme.margin > 0);
    }
  });
});

// ---------------------------------------------------------------------------
// Icon lookup
// ---------------------------------------------------------------------------

describe("Icon lookup", () => {
  it("returns a non-empty path for a known icon", () => {
    const icons = createIconLookup();
    const path = icons.get("repo");
    assert.ok(path.length > 0);
    // SVG path commands start with M, m, or similar
    assert.ok(
      /^[MmCcLlHhVvSsQqTtAa]/.test(path),
      `Path should start with a command: ${path}`,
    );
  });

  it("returns empty string for unknown icon", () => {
    const icons = createIconLookup();
    assert.strictEqual(icons.get("nonexistent-icon-xyz"), "");
  });

  it("returns different paths for different icons", () => {
    const icons = createIconLookup();
    const repo = icons.get("repo");
    const star = icons.get("star");
    assert.ok(repo.length > 0);
    assert.ok(star.length > 0);
    assert.notStrictEqual(repo, star);
  });
});
