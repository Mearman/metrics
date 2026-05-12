/**
 * Contributors plugin — data source.
 *
 * Fetches contributor breakdown for the user's top repositories.
 * Uses REST API (repos.listContributors) since GitHub GraphQL
 * does not expose a contributors field on Repository.
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
  /** Usernames to ignore (e.g. bots). Merged with global users_ignored. */
  ignored: z.array(z.string().trim()).default([]),
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
  isPrivate: boolean;
  contributors: Contributor[];
}

export interface ContributorsData {
  repos: RepoContributors[];
}

// ---------------------------------------------------------------------------
// GraphQL query — fetches repo list only
// ---------------------------------------------------------------------------

const REPOS_QUERY = `
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
          isPrivate
        }
      }
    }
  }
` as const;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ReposResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          nameWithOwner: z.string().trim(),
          isPrivate: z.boolean(),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// REST response schema
// ---------------------------------------------------------------------------

const ContributorSchema = z.object({
  login: z.string().trim(),
  avatar_url: z.string().trim(),
  contributions: z.number(),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch contributors for the user's top repositories.
 * Uses GraphQL to get the repo list, then REST for each repo's contributors.
 */
export async function fetchContributors(
  api: ApiClient,
  user: string,
  config: ContributorsConfig,
  repos: ReposConfig,
  usersIgnored: string[] = [],
): Promise<ContributorsData> {
  const reposQuery = REPOS_QUERY.replace(
    "__PRIVACY__",
    repoPrivacyFilter(repos),
  );
  const reposResult: RepoContributors[] = [];

  const raw = await api.graphql(reposQuery, {
    login: user,
    first: config.limit,
  });
  const parsed = ReposResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for contributors repos: ${parsed.error.message}`,
    );
  }

  for (const repo of parsed.data.user.repositories.nodes) {
    const slashIndex = repo.nameWithOwner.indexOf("/");
    const owner = repo.nameWithOwner.slice(0, slashIndex);
    const name = repo.nameWithOwner.slice(slashIndex + 1);

    try {
      const contributorsRaw = await api.rest.repos.listContributors({
        owner,
        repo: name,
        per_page: config.contributors_per_repo,
      });

      const ignoredSet = new Set([...usersIgnored, ...config.ignored]);
      const contributors: Contributor[] = [];
      for (const c of contributorsRaw.data) {
        const parsedContributor = ContributorSchema.safeParse(c);
        if (!parsedContributor.success) continue;
        if (ignoredSet.has(parsedContributor.data.login)) continue;
        if (parsedContributor.data.contributions >= config.threshold) {
          contributors.push({
            login: parsedContributor.data.login,
            avatarUrl: parsedContributor.data.avatar_url,
            contributions: parsedContributor.data.contributions,
          });
        }
      }

      if (contributors.length > 0) {
        reposResult.push({
          repository: repo.nameWithOwner,
          isPrivate: repo.isPrivate,
          contributors: contributors.slice(0, config.contributors_per_repo),
        });
      }
    } catch {
      // Skip repos where we can't list contributors (e.g. empty repos)
    }
  }

  return { repos: reposResult };
}
