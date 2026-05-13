/**
 * Shared GraphQL query helpers for repo filtering.
 *
 * Plugins call `repoPrivacyFilter` to get the right GraphQL filter
 * and `repoFields` to get the standard set of repo properties
 * including `isPrivate`.
 */

import type { ReposConfig } from "./filter.ts";

/**
 * Returns the GraphQL privacy argument string.
 * When fetch is "all", no privacy filter is applied.
 * When fetch is "public", adds `privacy: PUBLIC`.
 */
export function repoPrivacyFilter(repos: ReposConfig): string {
  return repos.fetch === "all" ? "" : "privacy: PUBLIC";
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
