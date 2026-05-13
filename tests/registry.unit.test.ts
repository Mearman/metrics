import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  registerPlugin,
  getPlugin,
  listPlugins,
} from "../src/plugins/registry.ts";

describe("Plugin registry", () => {
  it("registers and looks up a plugin by ID", () => {
    const fakePlugin = {
      id: "test-plugin",
      source: {
        id: "test-plugin",
        configSchema: {} as never,
        fetch: async () => ({}),
      },
      renderer: { render: () => ({ height: 0, elements: [] }) },
    };

    registerPlugin(fakePlugin);
    const found = getPlugin("test-plugin");
    assert.ok(found !== undefined);
    assert.strictEqual(found.id, "test-plugin");
  });

  it("returns undefined for unknown plugin ID", () => {
    const found = getPlugin("nonexistent");
    assert.strictEqual(found, undefined);
  });

  it("throws when registering a duplicate plugin ID", () => {
    const first = {
      id: "dup-test",
      source: {
        id: "dup-test",
        configSchema: {} as never,
        fetch: async () => "first",
      },
      renderer: { render: () => ({ height: 0, elements: [] }) },
    };

    registerPlugin(first);
    assert.throws(() => {
      registerPlugin(first);
    }, /already registered/);
  });

  it("lists registered plugin IDs", () => {
    const ids = listPlugins();
    assert.ok(ids.includes("test-plugin"));
  });
});
