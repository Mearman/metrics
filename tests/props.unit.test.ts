import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getString,
  getNumber,
  getBoolean,
  getArrayLength,
} from "../src/util/props.ts";

describe("Property extraction utilities", () => {
  it("getString extracts a string property", () => {
    const obj = { name: "test", count: 5 };
    assert.strictEqual(getString(obj, "name"), "test");
  });

  it("getString returns undefined for non-string property", () => {
    const obj = { name: 42 };
    assert.strictEqual(getString(obj, "name"), undefined);
  });

  it("getString returns undefined for missing key", () => {
    const obj = { name: "test" };
    assert.strictEqual(getString(obj, "missing"), undefined);
  });

  it("getString returns undefined for null value", () => {
    const obj = { name: null };
    assert.strictEqual(getString(obj, "name"), undefined);
  });

  it("getString returns undefined for non-object input", () => {
    assert.strictEqual(getString("hello", "length"), undefined);
    assert.strictEqual(getString(null, "key"), undefined);
    assert.strictEqual(getString(undefined, "key"), undefined);
  });

  it("getNumber extracts a number property", () => {
    const obj = { count: 42, name: "test" };
    assert.strictEqual(getNumber(obj, "count"), 42);
    assert.strictEqual(getNumber(obj, "name"), undefined);
  });

  it("getBoolean extracts a boolean property", () => {
    const obj = { active: true, name: "test" };
    assert.strictEqual(getBoolean(obj, "active"), true);
    assert.strictEqual(getBoolean(obj, "name"), undefined);
  });

  it("getArrayLength returns array length", () => {
    const obj = { items: [1, 2, 3] };
    assert.strictEqual(getArrayLength(obj, "items"), 3);
  });

  it("getArrayLength returns undefined for non-array", () => {
    const obj = { items: "not-array" };
    assert.strictEqual(getArrayLength(obj, "items"), undefined);
  });

  it("getArrayLength returns undefined for missing key", () => {
    const obj = {};
    assert.strictEqual(getArrayLength(obj, "items"), undefined);
  });

  it("works with nested objects via chaining", () => {
    const data = { user: { profile: { name: "Alice" } } };
    const user =
      typeof data.user === "object" && data.user !== null
        ? data.user
        : undefined;
    const profile =
      user !== undefined
        ? typeof user.profile === "object" && user.profile !== null
          ? user.profile
          : undefined
        : undefined;
    assert.strictEqual(getString(profile, "name"), "Alice");
  });
});
