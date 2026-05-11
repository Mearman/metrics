/**
 * Discussions plugin — data source.
 *
 * Fetches GitHub discussions statistics via GraphQL.
 * Requires the Discussions GraphQL API (available with github.token).
 */

import * as Zod from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const DiscussionsConfig = Zod.object({
  categories: Zod.boolean().default(true),
  limit: Zod.int().min(1).max(20).default(5),
});

export type DiscussionsConfig = Zod.infer<typeof DiscussionsConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface DiscussionCategory {
  name: string;
  discussionCount: number;
}

export interface DiscussionsData {
  totalCount: number;
  categories: DiscussionCategory[];
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
query($login: String!) {
  user(login: $login) {
    repositoryDiscussionCategories(first: 10) {
      nodes {
        name
        discussionCount
      }
    }
  }
}`;

const COUNT_QUERY = `
query($login: String!) {
  user(login: $login) {
    repositories(first: 100, privacy: PUBLIC, ownerAffiliations: [OWNER]) {
      nodes {
        discussions(first: 1) {
          totalCount
        }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

interface CategoryNode {
  name: string;
  discussionCount: number;
}

export async function fetchDiscussions(
  ctx: FetchContext,
  config: DiscussionsConfig,
): Promise<DiscussionsData> {
  // Get categories (only works on user-level, may fail gracefully)
  let categories: DiscussionCategory[] = [];

  if (config.categories) {
    try {
      const result = await ctx.api.graphql<{
        user: {
          repositoryDiscussionCategories: {
            nodes: CategoryNode[];
          };
        };
      }>(QUERY, { login: ctx.user });

      categories = result.user.repositoryDiscussionCategories.nodes
        .filter((c) => c.discussionCount > 0)
        .sort((a, b) => b.discussionCount - a.discussionCount);
    } catch {
      // Discussions API may not be available for all users
    }
  }

  // Count total discussions across repos
  const countResult = await ctx.api.graphql<{
    user: {
      repositories: {
        nodes: { discussions: { totalCount: number } }[];
      };
    };
  }>(COUNT_QUERY, { login: ctx.user });

  const totalCount = countResult.user.repositories.nodes.reduce(
    (sum, repo) => sum + repo.discussions.totalCount,
    0,
  );

  return { totalCount, categories };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const discussionsSource: DataSource<DiscussionsConfig, DiscussionsData> =
  {
    id: "discussions",
    configSchema: DiscussionsConfig,
    async fetch(ctx, config) {
      return await fetchDiscussions(ctx, config);
    },
  };
