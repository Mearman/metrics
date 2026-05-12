/**
 * Stargazers plugin — data source.
 *
 * Fetches stargazer counts per repository to render a star history chart.
 * Uses a simplified approach: aggregates star counts from user repos
 * rather than paginating through individual star events.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
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
      privacy: PUBLIC
      ownerAffiliations: [OWNER]
      orderBy: { field: STARGAZERS, direction: DESC }
    ) {
      nodes {
        name
        stargazerCount
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

interface QueryResult {
  user: {
    repositories: {
      nodes: { name: string; stargazerCount: number }[];
    };
  };
}

export async function fetchStargazers(
  ctx: FetchContext,
  config: StargazersConfig,
): Promise<StargazersData> {
  const result = await ctx.api.graphql<QueryResult>(QUERY, {
    login: ctx.user,
    limit: config.limit,
  });

  const repos = result.user.repositories.nodes.map((node) => ({
    name: node.name,
    stars: node.stargazerCount,
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
