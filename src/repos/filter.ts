/**
 * Repository filtering engine.
 *
 * Every repo is assigned one of three treatments:
 * - include — count in totals, name in per-repo lists
 * - count   — count in totals, don't name it
 * - exclude — skip entirely
 *
 * Rules are evaluated top-to-bottom; first match wins.
 * Unmatched repos default based on the fetch level:
 * - public repos default to include
 * - private repos default to count (when fetched)
 */

import * as z from "zod";
import { minimatch } from "minimatch";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RepoAction = "include" | "count" | "exclude";

export interface RepoProperties {
  /** owner/repo */
  name: string;
  /** true if the repo is private */
  isPrivate: boolean;
  /** Owner (user or org) */
  owner: string;
  /** Topics/tags on the repo */
  topics: string[];
  /** Primary language name */
  language: string | null;
}

// ---------------------------------------------------------------------------
// Match schema
// ---------------------------------------------------------------------------

const StringMatch = z.union([
  z.string().trim(),
  z
    .string()
    .trim()
    .regex(/^\/.*\/$/),
]);

const PropertyMatch = z.object({
  visibility: z.enum(["public", "private"]).optional(),
  org: z.string().trim().optional(),
  topic: z.string().trim().optional(),
  lang: z.string().trim().optional(),
});

const MatchSchema = z.union([StringMatch, PropertyMatch]);

// ---------------------------------------------------------------------------
// Rule schema
// ---------------------------------------------------------------------------

export const RepoRuleSchema = z.object({
  match: MatchSchema,
  action: z.enum(["include", "count", "exclude"]),
});
export type RepoRule = z.infer<typeof RepoRuleSchema>;

// ---------------------------------------------------------------------------
// Top-level config schema
// ---------------------------------------------------------------------------

export const ReposConfigSchema = z.object({
  /** Which repos to fetch from GitHub */
  fetch: z.enum(["public", "all"]).default("public"),
  /** Ordered rules for assigning treatment to repos */
  rules: z.array(RepoRuleSchema).default([]),
});
export type ReposConfig = z.infer<typeof ReposConfigSchema>;

// ---------------------------------------------------------------------------
// Match logic
// ---------------------------------------------------------------------------

/**
 * Test if a string value matches a glob or regex pattern.
 * Patterns wrapped in /.../ are treated as regex.
 */
function matchString(pattern: string, value: string): boolean {
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    const regexBody = pattern.slice(1, -1);
    return new RegExp(regexBody).test(value);
  }
  return minimatch(value, pattern);
}

/**
 * Test if a repo matches a single match criterion.
 */
function matchRepo(
  match: z.infer<typeof MatchSchema>,
  repo: RepoProperties,
): boolean {
  // String match — glob or regex against full name
  if (typeof match === "string") {
    return matchString(match, repo.name);
  }

  // Property match — all specified properties must match (AND)
  if (match.visibility !== undefined) {
    const expected = match.visibility === "private";
    if (repo.isPrivate !== expected) return false;
  }
  if (match.org !== undefined) {
    if (!matchString(match.org, repo.owner)) return false;
  }
  if (match.topic !== undefined) {
    if (!repo.topics.includes(match.topic)) return false;
  }
  if (match.lang !== undefined) {
    if (repo.language?.toLowerCase() !== match.lang.toLowerCase()) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Action evaluation
// ---------------------------------------------------------------------------

/**
 * Determine the action for a repo based on rules and defaults.
 */
export function resolveAction(
  repo: RepoProperties,
  rules: RepoRule[],
): RepoAction {
  for (const rule of rules) {
    if (matchRepo(rule.match, repo)) {
      return rule.action;
    }
  }

  // Default: public repos → include, private repos → count
  return repo.isPrivate ? "count" : "include";
}

/**
 * Check if a repo should be fetched at all.
 */
export function shouldFetch(
  repo: RepoProperties,
  fetchLevel: "public" | "all",
): boolean {
  if (fetchLevel === "all") return true;
  return !repo.isPrivate;
}

/**
 * Check if a repo should be named in per-repo output.
 */
export function shouldEnumerate(
  repo: RepoProperties,
  rules: RepoRule[],
): boolean {
  return resolveAction(repo, rules) === "include";
}

/**
 * Check if a repo should be excluded entirely.
 */
export function isExcluded(repo: RepoProperties, rules: RepoRule[]): boolean {
  return resolveAction(repo, rules) === "exclude";
}
