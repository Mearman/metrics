/**
 * Languages plugin — data source.
 *
 * Fetches language breakdown from the user's repositories.
 * Supports both total and recent (last N days) breakdowns.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import { repoPrivacyFilter } from "../../repos/graphql.ts";
import type { ReposConfig } from "../../repos/filter.ts";

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const LANGUAGES_QUERY = `
  query($login: String!, $first: Int!, $after: String) {
    user(login: $login) {
      repositories(
        first: $first
        after: $after
        __PRIVACY__
        ownerAffiliations: OWNER
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
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

export const LanguagesConfig = z.object({
  limit: z.int().min(1).max(20).default(8),
  threshold: z.number().min(0).max(100).default(1),
  sections: z
    .array(z.enum(["markup", "programming"]))
    .default(["markup", "programming"]),
});
export type LanguagesConfig = z.infer<typeof LanguagesConfig>;

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

export interface LanguageEntry {
  name: string;
  colour: string;
  size: number;
}

export interface LanguagesData {
  total: LanguageEntry[];
  totalBytes: number;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch language breakdown from the user's public repositories.
 *
 * Aggregates byte sizes per language across all repos.
 */
export async function fetchLanguages(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  repos: ReposConfig,
  options?: { limit?: number },
): Promise<LanguagesData> {
  const privacyFilter = repoPrivacyFilter(repos);
  const query = LANGUAGES_QUERY.replace("__PRIVACY__", privacyFilter);
  const repoLimit = options?.limit ?? 300;
  const aggregated = new Map<string, { size: number; colour: string }>();
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const raw = await api.graphql(query, {
      login: user,
      first: Math.min(repoLimit, 100),
      after: cursor,
    });
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for languages: ${parsed.error.message}`,
      );
    }

    const repos = parsed.data.user.repositories;

    for (const repo of repos.nodes) {
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        const existing = aggregated.get(name);
        if (existing !== undefined) {
          existing.size += edge.size;
        } else {
          aggregated.set(name, {
            size: edge.size,
            colour: edge.node.color ?? "#8b949e",
          });
        }
      }
    }

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;
  }

  // Sort by size descending
  const total = [...aggregated.entries()]
    .map(([name, { size, colour }]) => ({ name, colour, size }))
    .sort((a, b) => b.size - a.size);

  const totalBytes = total.reduce((sum, lang) => sum + lang.size, 0);

  return { total, totalBytes };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const languagesSource: DataSource<LanguagesConfig, LanguagesData> = {
  id: "languages",
  configSchema: LanguagesConfig,
  async fetch(ctx) {
    return await fetchLanguages(ctx.api, ctx.user, ctx.repos);
  },
};
