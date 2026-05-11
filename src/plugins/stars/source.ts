/**
 * Stars plugin — data source.
 *
 * Fetches recently starred repositories from GitHub.
 */

import * as Zod from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const StarsConfig = Zod.object({
  limit: Zod.int().min(1).max(100).default(4),
});

export type StarsConfig = Zod.infer<typeof StarsConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface StarredRepo {
  nameWithOwner: string;
  description: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string; color: string } | null;
  starredAt: string;
}

export interface StarsData {
  repositories: StarredRepo[];
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const STARS_QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    starredRepositories(first: $limit, orderBy: { field: STARRED_AT, direction: DESC }) {
      edges {
        starredAt
        node {
          description
          forkCount
          nameWithOwner
          stargazerCount
          primaryLanguage { name color }
        }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

interface StarEdge {
  starredAt: string;
  node: {
    description: string | null;
    forkCount: number;
    nameWithOwner: string;
    stargazerCount: number;
    primaryLanguage: { name: string; color: string } | null;
  };
}

export async function fetchStars(
  ctx: FetchContext,
  config: StarsConfig,
): Promise<StarsData> {
  const result = await ctx.api.graphql<{
    user: {
      starredRepositories: {
        edges: StarEdge[];
      };
    };
  }>(STARS_QUERY, { login: ctx.user, limit: config.limit });

  const repositories: StarredRepo[] = result.user.starredRepositories.edges.map(
    (edge) => ({
      nameWithOwner: edge.node.nameWithOwner,
      description: edge.node.description,
      stargazerCount: edge.node.stargazerCount,
      forkCount: edge.node.forkCount,
      primaryLanguage: edge.node.primaryLanguage,
      starredAt: edge.starredAt,
    }),
  );

  return { repositories };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const starsSource: DataSource<StarsConfig, StarsData> = {
  id: "stars",
  configSchema: StarsConfig,
  async fetch(ctx, config) {
    return await fetchStars(ctx, config);
  },
};
