/**
 * Base plugin — user profile header data source.
 *
 * Fetches the user's profile information: avatar, name, bio,
 * company, location, and account statistics.
 *
 * Uses Zod for runtime validation of the GraphQL response —
 * single source of truth for both type and validator.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const PROFILE_QUERY = `
  query($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl
      bio
      company
      location
      createdAt
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(privacy: PUBLIC, ownerAffiliations: OWNER) {
        totalCount
      }
      issues {
        totalCount
      }
      pullRequests {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
      }
    }
  }
` as const;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const BasePluginConfig = z.object({
  sections: z
    .array(
      z.enum(["header", "activity", "community", "repositories", "metadata"]),
    )
    .default(["header", "activity", "community", "repositories", "metadata"]),
  indepth: z.boolean().default(false),
});
export type BasePluginConfig = z.infer<typeof BasePluginConfig>;

// ---------------------------------------------------------------------------
// Zod response schema — single source of truth
// ---------------------------------------------------------------------------

const ProfileResponseSchema = z.object({
  user: z.object({
    name: z.string().trim(),
    login: z.string().trim(),
    avatarUrl: z.string().trim(),
    bio: z.string().trim().nullable(),
    company: z.string().trim().nullable(),
    location: z.string().trim().nullable(),
    createdAt: z.string().trim(),
    followers: z.object({ totalCount: z.number() }),
    following: z.object({ totalCount: z.number() }),
    repositories: z.object({ totalCount: z.number() }),
    issues: z.object({ totalCount: z.number() }),
    pullRequests: z.object({ totalCount: z.number() }),
    contributionsCollection: z.object({
      totalCommitContributions: z.number(),
      totalPullRequestContributions: z.number(),
      totalIssueContributions: z.number(),
      totalRepositoryContributions: z.number(),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data type — inferred from the Zod schema
// ---------------------------------------------------------------------------

export interface UserProfile {
  name: string;
  login: string;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  createdAt: string;
  followers: number;
  following: number;
  publicRepositories: number;
  issues: number;
  pullRequests: number;
  totalCommits: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalRepositoryContributions: number;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch user profile data from GitHub GraphQL API.
 *
 * Validates the response through Zod — runtime safety without assertions.
 */
export async function fetchProfile(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
): Promise<UserProfile> {
  const raw = await api.graphql(PROFILE_QUERY, { login: user });
  const parsed = ProfileResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for user profile: ${parsed.error.message}`,
    );
  }

  const u = parsed.data.user;
  return {
    name: u.name,
    login: u.login,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    company: u.company,
    location: u.location,
    createdAt: u.createdAt,
    followers: u.followers.totalCount,
    following: u.following.totalCount,
    publicRepositories: u.repositories.totalCount,
    issues: u.issues.totalCount,
    pullRequests: u.pullRequests.totalCount,
    totalCommits: u.contributionsCollection.totalCommitContributions,
    totalPullRequestContributions:
      u.contributionsCollection.totalPullRequestContributions,
    totalIssueContributions: u.contributionsCollection.totalIssueContributions,
    totalRepositoryContributions:
      u.contributionsCollection.totalRepositoryContributions,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const baseSource: DataSource<BasePluginConfig, UserProfile> = {
  id: "base",
  configSchema: BasePluginConfig,
  async fetch(ctx) {
    return await fetchProfile(ctx.api, ctx.user);
  },
};
