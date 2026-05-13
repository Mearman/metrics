/**
 * Shared GraphQL query helpers for repo filtering.
 *
 * Queries include `privacy: PUBLIC` as static, valid GraphQL.
 * When `repos.fetch` is "all", `applyPublicFilter` strips the
 * argument so private repos are included in the response.
 */

import type { ReposConfig } from "./filter.ts";

/**
 * Strip `privacy: PUBLIC` from a query when fetching all repos.
 *
 * Queries are written with `privacy: PUBLIC` so they are valid
 * GraphQL and can be statically analysed. When the config requests
 * all repos (public + private), this removes the filter at runtime.
 */
export function applyPublicFilter(query: string, repos: ReposConfig): string {
  if (repos.fetch === "all") {
    return query
      .replace(/,\s*privacy: PUBLIC/g, "")
      .replace(/privacy: PUBLIC,\s*/g, "")
      .replace(/\s*privacy: PUBLIC\s*\n/g, "\n");
  }
  return query;
}

/**
 * Standard repo fields that every plugin should fetch
 * when they need to apply repo filtering.
 */
export const REPO_FIELDS = `
  nameWithOwner
  isPrivate
  owner { login }
  repositoryTopics(first: 20) { nodes { topic { name } } }
  primaryLanguage { name }
`;
