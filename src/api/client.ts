/**
 * GitHub API client — thin abstraction over Octokit.
 *
 * Provides typed GraphQL and REST access with automatic retry
 * on transient errors (HTTP 500, 502, 503, network timeouts).
 * Implements the ApiClient port from src/plugins/types.ts.
 */

import { Octokit } from "@octokit/rest";
import { getNumber } from "../util/props.ts";
import type { ApiClient } from "../plugins/types.ts";

/** HTTP status codes that indicate transient server errors. */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);

/** Maximum number of retry attempts for transient errors. */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff. */
const BASE_DELAY_MS = 1000;

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if an error is transient and worth retrying.
 */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Octokit wraps GraphQL errors with a `status` property.
  // We need to safely extract it from an unknown error — use
  // props helper which handles the narrowing pattern.
  const status = getNumber(error, "status");
  if (status !== undefined && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  // Network-level errors (ECONNRESET, ETIMEDOUT, etc.)
  if (error.message.includes("ECONNRESET")) return true;
  if (error.message.includes("ETIMEDOUT")) return true;
  if (error.message.includes("socket hang up")) return true;

  // GitHub GraphQL GOAWAY errors
  if (error.message.includes("GOAWAY")) return true;

  return false;
}

/**
 * Execute a function with exponential backoff on transient errors.
 *
 * @param fn - Async function to execute
 * @param retries - Remaining retry attempts
 * @returns The result of fn()
 * @throws The last error if all retries are exhausted
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries <= 0 || !isTransientError(error)) {
      throw error;
    }

    const delay = BASE_DELAY_MS * 2 ** (MAX_RETRIES - retries);
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `Transient API error: ${message} — retrying in ${String(delay)}ms (${String(retries)} attempts remaining)`,
    );

    await sleep(delay);
    return await withRetry(fn, retries - 1);
  }
}

/**
 * Create an authenticated GitHub API client with automatic retry.
 *
 * @param token - GitHub token (GITHUB_TOKEN, PAT, or fine-grained PAT)
 */
export function createClient(token: string): ApiClient {
  const octokit = new Octokit({ auth: token });

  return {
    async graphql<T>(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<T> {
      return await withRetry(() => octokit.graphql<T>(query, variables));
    },

    rest: octokit,
  };
}
