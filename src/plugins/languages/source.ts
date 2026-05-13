/**
 * Languages plugin — data source.
 *
 * Fetches language breakdown from the user's repositories.
 * Supports both total and recent (last N days) breakdowns.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import { applyPublicFilter } from "../../repos/graphql.ts";
import type { ReposConfig } from "../../repos/filter.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const LANGUAGES_QUERY = gql`
  query ($login: String!, $first: Int!, $after: String) {
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
`;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const LanguagesConfig = z.object({
  /** Maximum number of languages to display */
  limit: z.int().min(1).max(20).default(8),
  /** Minimum percentage to display a language */
  threshold: z.number().min(0).max(100).default(1),
  /** Languages to ignore (e.g. ["html", "css"]) */
  ignored: z.array(z.string().trim()).default([]),
  /** Group unknown, ignored and over-limit languages into "Other" */
  other: z.boolean().default(false),
  /** Custom colour overrides (e.g. { "javascript": "red" }) */
  colors: z.record(z.string(), z.string().trim()).default({}),
  /** Custom name aliases (e.g. { "javascript": "JS" }) */
  aliases: z.record(z.string(), z.string().trim()).default({}),
  /** Additional details to show: bytes-size, percentage */
  details: z.array(z.enum(["bytes-size", "percentage"])).default([]),
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
  /** Bytes that went into "Other" bucket (0 if other is false) */
  otherBytes: number;
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
  const query = applyPublicFilter(LANGUAGES_QUERY, repos);
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

  return { total, totalBytes, otherBytes: 0 };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const languagesSource: DataSource<LanguagesConfig, LanguagesData> = {
  id: "languages",
  configSchema: LanguagesConfig,
  // Fetch is config-independent — limit/threshold/ignored/other/colors/aliases/details
  // are all render-time concerns. The full language breakdown is always fetched.
  fetchKey: () => ({}),
  async fetch(ctx) {
    return await fetchLanguages(ctx.api, ctx.user, ctx.repos);
  },

  isEmpty(data) {
    return data.total.length === 0;
  },
};
