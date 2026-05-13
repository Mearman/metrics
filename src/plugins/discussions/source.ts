/**
 * Discussions plugin — data source.
 *
 * Fetches GitHub discussions statistics via GraphQL.
 * Requires the Discussions GraphQL API (available with github.token).
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";
import { repoPrivacyFilter } from "../../repos/graphql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const DiscussionsConfig = z.object({
  categories: z.boolean().default(true),
  limit: z.int().min(1).max(20).default(5),
});

export type DiscussionsConfig = z.infer<typeof DiscussionsConfig>;

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
// GraphQL queries
// ---------------------------------------------------------------------------

const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      repositoryDiscussionCategories(first: 10) {
        nodes {
          name
          discussionCount
        }
      }
    }
  }
`;

const COUNT_QUERY = `
query($login: String!) {
  user(login: $login) {
    repositories(first: 100, __PRIVACY__, ownerAffiliations: [OWNER]) {
      nodes {
        discussions(first: 1) {
          totalCount
        }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Zod response schemas
// ---------------------------------------------------------------------------

const CategoriesResponseSchema = z.object({
  user: z.object({
    repositoryDiscussionCategories: z.object({
      nodes: z.array(
        z.object({
          name: z.string().trim(),
          discussionCount: z.number(),
        }),
      ),
    }),
  }),
});

const CountResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          discussions: z.object({ totalCount: z.number() }),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchDiscussions(
  ctx: FetchContext,
  config: DiscussionsConfig,
): Promise<DiscussionsData> {
  const query = QUERY.replace("__PRIVACY__", repoPrivacyFilter(ctx.repos));
  const countQuery = COUNT_QUERY.replace(
    "__PRIVACY__",
    repoPrivacyFilter(ctx.repos),
  );
  // Get categories (only works on user-level, may fail gracefully)
  let categories: DiscussionCategory[] = [];

  if (config.categories) {
    try {
      const raw = await ctx.api.graphql(query, { login: ctx.user });
      const parsed = CategoriesResponseSchema.safeParse(raw);
      if (parsed.success) {
        categories = parsed.data.user.repositoryDiscussionCategories.nodes
          .filter((c) => c.discussionCount > 0)
          .sort((a, b) => b.discussionCount - a.discussionCount);
      }
    } catch {
      // Discussions API may not be available for all users
    }
  }

  // Count total discussions across repos
  const rawCount = await ctx.api.graphql(countQuery, { login: ctx.user });
  const parsedCount = CountResponseSchema.safeParse(rawCount);
  if (!parsedCount.success) {
    throw new Error(
      `Invalid GraphQL response for discussions count: ${parsedCount.error.message}`,
    );
  }

  const totalCount = parsedCount.data.user.repositories.nodes.reduce(
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
