/**
 * Gists plugin — data source.
 *
 * Fetches gist statistics from GitHub.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const GistsConfig = z.object({});

export type GistsConfig = z.infer<typeof GistsConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface GistsData {
  totalCount: number;
  stargazers: number;
  forks: number;
  files: number;
  comments: number;
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    gists(first: $limit) {
      totalCount
      nodes {
        isFork
        stargazerCount
        forks { totalCount }
        comments { totalCount }
        files { name }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    gists: z.object({
      totalCount: z.number(),
      nodes: z.array(
        z.object({
          isFork: z.boolean(),
          stargazerCount: z.number(),
          forks: z.object({ totalCount: z.number() }),
          comments: z.object({ totalCount: z.number() }),
          files: z.array(z.object({ name: z.string().trim() })),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchGists(
  ctx: FetchContext,
  _config: GistsConfig,
): Promise<GistsData> {
  void _config;
  const raw = await ctx.api.graphql(QUERY, {
    login: ctx.user,
    limit: 100,
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for gists: ${parsed.error.message}`,
    );
  }

  let stargazers = 0;
  let forks = 0;
  let comments = 0;
  let files = 0;

  for (const gist of parsed.data.user.gists.nodes) {
    if (gist.isFork) continue;
    stargazers += gist.stargazerCount;
    forks += gist.forks.totalCount;
    comments += gist.comments.totalCount;
    files += gist.files.length;
  }

  return {
    totalCount: parsed.data.user.gists.totalCount,
    stargazers,
    forks,
    files,
    comments,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const gistsSource: DataSource<GistsConfig, GistsData> = {
  id: "gists",
  configSchema: GistsConfig,
  // Fetch is config-independent.
  fetchKey: () => ({}),
  async fetch(ctx, config) {
    return await fetchGists(ctx, config);
  },
};
