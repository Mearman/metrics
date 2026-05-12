/**
 * Contributors plugin — data source.
 *
 * Fetches contributor breakdown for the user's repositories.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { ApiClient } from "../types.ts";
import { repoPrivacyFilter } from "../../repos/graphql.ts";
import type { ReposConfig } from "../../repos/filter.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const ContributorsConfig = z.object({
  /** Maximum repositories to show */
  limit: z.int().min(1).max(20).default(6),
  /** Maximum contributors per repo */
  contributors_per_repo: z.int().min(1).max(20).default(8),
  /** Minimum contribution count to show */
  threshold: z.int().min(1).default(1),
});
export type ContributorsConfig = z.infer<typeof ContributorsConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
  query($login: String!, $first: Int!, $after: String) {
    user(login: $login) {
      repositories(
        first: $first
        after: $after
        __PRIVACY__
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

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          nameWithOwner: z.string().trim(),
          contributors: z.object({
            nodes: z.array(
              z.object({
                login: z.string().trim(),
                avatarUrl: z.string().trim(),
                contributions: z.number(),
              }),
            ),
          }),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch contributors for the user's top repositories.
 */
export async function fetchContributors(
  api: ApiClient,
  user: string,
  config: ContributorsConfig,
  repos: ReposConfig,
): Promise<ContributorsData> {
  const reposQuery = QUERY.replace("__PRIVACY__", repoPrivacyFilter(repos));
  const reposResult: RepoContributors[] = [];

  const raw = await api.graphql(reposQuery, {
    login: user,
    first: config.limit,
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for contributors: ${parsed.error.message}`,
    );
  }

  for (const repo of parsed.data.user.repositories.nodes) {
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
      reposResult.push({
        repository: repo.nameWithOwner,
        contributors: contributors.slice(0, config.contributors_per_repo),
      });
    }
  }

  return { repos: reposResult };
}
