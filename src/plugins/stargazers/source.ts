/**
 * Stargazers plugin — data source.
 *
 * Fetches stargazer counts per repository to render a star history chart.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";
import { repoPrivacyFilter } from "../../repos/graphql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const StargazersConfig = z.object({
  /** Number of recent repos to show (sorted by stars) */
  limit: z.int().min(1).max(30).default(8),
});

export type StargazersConfig = z.infer<typeof StargazersConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface RepoStars {
  name: string;
  stars: number;
  isPrivate: boolean;
}

export interface StargazersData {
  repos: RepoStars[];
  totalStars: number;
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    repositories(
      first: $limit
      __PRIVACY__
      ownerAffiliations: [OWNER]
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      nodes {
        name
        stargazerCount
        isPrivate
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          name: z.string().trim(),
          stargazerCount: z.number(),
          isPrivate: z.boolean(),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchStargazers(
  ctx: FetchContext,
  config: StargazersConfig,
): Promise<StargazersData> {
  const query = QUERY.replace("__PRIVACY__", repoPrivacyFilter(ctx.repos));
  const raw = await ctx.api.graphql(query, {
    login: ctx.user,
    limit: config.limit,
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for stargazers: ${parsed.error.message}`,
    );
  }

  const repos = parsed.data.user.repositories.nodes.map((node) => ({
    name: node.name,
    stars: node.stargazerCount,
    isPrivate: node.isPrivate,
  }));

  const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);

  return { repos, totalStars };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const stargazersSource: DataSource<StargazersConfig, StargazersData> = {
  id: "stargazers",
  configSchema: StargazersConfig,
  async fetch(ctx, config) {
    return await fetchStargazers(ctx, config);
  },
};
