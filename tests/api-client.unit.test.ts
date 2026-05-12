/**
 * Tests for the API client retry logic.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isTransientError } from "../src/api/client.ts";

/** Create an error with a status code for testing. */
function errorWithStatus(message: string, status: number): Error {
  const error = new Error(message);
  Object.assign(error, { status });
  return error;
}

describe("API client retry", () => {
  it("identifies HTTP 500 as transient", () => {
    assert.ok(isTransientError(errorWithStatus("Internal Server Error", 500)));
  });

  it("identifies HTTP 502 as transient", () => {
    assert.ok(isTransientError(errorWithStatus("Bad Gateway", 502)));
  });

  it("identifies HTTP 503 as transient", () => {
    assert.ok(isTransientError(errorWithStatus("Service Unavailable", 503)));
  });

  it("identifies ECONNRESET as transient", () => {
    assert.ok(isTransientError(new Error("read ECONNRESET")));
  });

  it("identifies GOAWAY as transient", () => {
    assert.ok(isTransientError(new Error("GOAWAY")));
  });

  it("does not identify HTTP 403 as transient", () => {
    assert.ok(!isTransientError(errorWithStatus("Forbidden", 403)));
  });

  it("does not identify non-Error values as transient", () => {
    assert.ok(!isTransientError("string error"));
    assert.ok(!isTransientError(42));
    assert.ok(!isTransientError(null));
  });

  it("does not identify regular errors as transient", () => {
    assert.ok(!isTransientError(new Error("Something went wrong")));
  });
});
