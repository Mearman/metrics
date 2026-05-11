/**
 * Gists plugin — data source.
 *
 * Fetches gist statistics from GitHub.
 */

import * as Zod from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const GistsConfig = Zod.object({});

export type GistsConfig = Zod.infer<typeof GistsConfig>;

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
// Fetch
// ---------------------------------------------------------------------------

interface GistNode {
  isFork: boolean;
  stargazerCount: number;
  forks: { totalCount: number };
  comments: { totalCount: number };
  files: { name: string }[];
}

export async function fetchGists(
  ctx: FetchContext,
  _config: GistsConfig,
): Promise<GistsData> {
  void _config;
  const result = await ctx.api.graphql<{
    user: {
      gists: {
        totalCount: number;
        nodes: GistNode[];
      };
    };
  }>(QUERY, { login: ctx.user, limit: 100 });

  let stargazers = 0;
  let forks = 0;
  let comments = 0;
  let files = 0;

  for (const gist of result.user.gists.nodes) {
    if (gist.isFork) continue;
    stargazers += gist.stargazerCount;
    forks += gist.forks.totalCount;
    comments += gist.comments.totalCount;
    files += gist.files.length;
  }

  return {
    totalCount: result.user.gists.totalCount,
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
  async fetch(ctx, config) {
    return await fetchGists(ctx, config);
  },
};
