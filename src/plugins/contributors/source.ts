/**
 * Contributors plugin — data source.
 *
 * Fetches contributor breakdown for the user's repositories.
 */

import * as z from "zod";
import type { ApiClient } from "../types.ts";

export const ContributorsConfig = z.object({
  /** Maximum repositories to show */
  limit: z.int().min(1).max(20).default(6),
  /** Maximum contributors per repo */
  contributors_per_repo: z.int().min(1).max(20).default(8),
  /** Minimum contribution count to show */
  threshold: z.int().min(1).default(1),
});
export type ContributorsConfig = z.infer<typeof ContributorsConfig>;

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface RepoContributors {
  repository: string;
  contributors: Contributor[];
}

export interface ContributorsData {
  repos: RepoContributors[];
}

interface GraphQLResponse {
  user: {
    repositories: {
      nodes: {
        nameWithOwner: string;
        contributors: {
          nodes: {
            login: string;
            avatarUrl: string;
            contributions: number;
          }[];
        };
      }[];
    };
  };
}

const QUERY = `
  query($login: String!, $first: Int!, $after: String) {
    user(login: $login) {
      repositories(
        first: $first
        after: $after
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          nameWithOwner
          contributors(orderBy: {field: CONTRIBUTIONS, direction: DESC}, first: 20) {
            nodes {
              login
              avatarUrl
              contributions
            }
          }
        }
      }
    }
  }
` as const;

/**
 * Fetch contributors for the user's top repositories.
 */
export async function fetchContributors(
  api: ApiClient,
  user: string,
  config: ContributorsConfig,
): Promise<ContributorsData> {
  const repos: RepoContributors[] = [];

  const data = await api.graphql<GraphQLResponse>(QUERY, {
    login: user,
    first: config.limit,
  });

  for (const repo of data.user.repositories.nodes) {
    const contributors: Contributor[] = [];

    for (const c of repo.contributors.nodes) {
      if (c.contributions >= config.threshold) {
        contributors.push({
          login: c.login,
          avatarUrl: c.avatarUrl,
          contributions: c.contributions,
        });
      }
    }

    if (contributors.length > 0) {
      repos.push({
        repository: repo.nameWithOwner,
        contributors: contributors.slice(0, config.contributors_per_repo),
      });
    }
  }

  return { repos };
}
