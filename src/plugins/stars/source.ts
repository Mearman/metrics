/**
 * Stars plugin — data source.
 *
 * Fetches recently starred repositories from GitHub.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const StarsConfig = z.object({
  limit: z.int().min(1).max(100).default(4),
});

export type StarsConfig = z.infer<typeof StarsConfig>;

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

const STARS_QUERY = gql`
  query ($login: String!, $limit: Int!) {
    user(login: $login) {
      starredRepositories(
        first: $limit
        orderBy: { field: STARRED_AT, direction: DESC }
      ) {
        edges {
          starredAt
          node {
            description
            forkCount
            nameWithOwner
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    starredRepositories: z.object({
      edges: z.array(
        z.object({
          starredAt: z.string().trim(),
          node: z.object({
            description: z.string().trim().nullable(),
            forkCount: z.number(),
            nameWithOwner: z.string().trim(),
            stargazerCount: z.number(),
            primaryLanguage: z
              .object({
                name: z.string().trim(),
                color: z.string().trim(),
              })
              .nullable(),
          }),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchStars(
  ctx: FetchContext,
  config: StarsConfig,
): Promise<StarsData> {
  const raw = await ctx.api.graphql(STARS_QUERY, {
    login: ctx.user,
    limit: config.limit,
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for stars: ${parsed.error.message}`,
    );
  }

  const repositories: StarredRepo[] =
    parsed.data.user.starredRepositories.edges.map((edge) => ({
      nameWithOwner: edge.node.nameWithOwner,
      description: edge.node.description,
      stargazerCount: edge.node.stargazerCount,
      forkCount: edge.node.forkCount,
      primaryLanguage: edge.node.primaryLanguage,
      starredAt: edge.starredAt,
    }));

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

  isEmpty(data) {
    return data.repositories.length === 0;
  },
};
