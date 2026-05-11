/**
 * GitHub API client — thin abstraction over Octokit.
 *
 * Provides typed GraphQL and REST access with rate-limit awareness.
 * Implements the ApiClient port from src/plugins/types.ts.
 */

import { Octokit } from "@octokit/rest";
import type { ApiClient } from "../plugins/types.ts";

/**
 * Create an authenticated GitHub API client.
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
      return await octokit.graphql<T>(query, variables);
    },

    rest: octokit,
  };
}
