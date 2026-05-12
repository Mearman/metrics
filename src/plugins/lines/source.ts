/**
 * Lines plugin — data source.
 *
 * Fetches lines of code statistics from the user's repositories.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const REPO_LANGUAGES_QUERY = `
  query($login: String!, $first: Int!, $after: String) {
    user(login: $login) {
      repositories(
        first: $first
        after: $after
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          languages(first: 20) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
` as const;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const LinesConfig = z.object({
  limit: z.int().min(1).max(20).default(4),
  repositories: z.array(z.string().trim()).default([]),
  sections: z.array(z.enum(["repositories"])).default(["repositories"]),
});
export type LinesConfig = z.infer<typeof LinesConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      pageInfo: z.object({
        hasNextPage: z.boolean(),
        endCursor: z.string().trim().nullable(),
      }),
      nodes: z.array(
        z.object({
          name: z.string().trim(),
          languages: z.object({
            edges: z.array(
              z.object({
                size: z.number(),
                node: z.object({
                  name: z.string().trim(),
                  color: z.string().trim().nullable(),
                }),
              }),
            ),
          }),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface RepoLines {
  name: string;
  totalBytes: number;
  languages: { name: string; bytes: number; colour: string }[];
}

export interface LinesData {
  repos: RepoLines[];
  totalBytes: number;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch lines of code data (approximated from language byte sizes).
 */
export async function fetchLines(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  limit = 4,
): Promise<LinesData> {
  const repos: RepoLines[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let totalBytes = 0;

  while (hasNextPage && repos.length < limit) {
    const raw = await api.graphql(REPO_LANGUAGES_QUERY, {
      login: user,
      first: Math.min(limit - repos.length, 100),
      after: cursor,
    });
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for lines: ${parsed.error.message}`,
      );
    }

    const result = parsed.data.user.repositories;

    for (const repo of result.nodes) {
      const languages = repo.languages.edges.map((edge) => ({
        name: edge.node.name,
        bytes: edge.size,
        colour: edge.node.color ?? "#8b949e",
      }));
      const repoTotal = languages.reduce((sum, l) => sum + l.bytes, 0);

      if (repoTotal > 0) {
        repos.push({ name: repo.name, totalBytes: repoTotal, languages });
        totalBytes += repoTotal;
      }
    }

    hasNextPage = result.pageInfo.hasNextPage;
    cursor = result.pageInfo.endCursor;
  }

  return { repos: repos.slice(0, limit), totalBytes };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const linesSource: DataSource<LinesConfig, LinesData> = {
  id: "lines",
  configSchema: LinesConfig,
  async fetch(ctx, config) {
    return await fetchLines(ctx.api, ctx.user, config.limit);
  },
};
