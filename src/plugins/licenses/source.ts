/**
 * Licences plugin — data source.
 *
 * Fetches licence information from the user's public repositories.
 * Uses the `licenseInfo` field available with github.token.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import { applyPublicFilter } from "../../repos/graphql.ts";
import type { ReposConfig } from "../../repos/filter.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const LicencesConfig = z.object({
  /** Maximum licences to display */
  limit: z.int().min(1).max(20).default(8),
});
export type LicencesConfig = z.infer<typeof LicencesConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          licenseInfo: z
            .object({
              spdxId: z.string().trim(),
              name: z.string().trim(),
            })
            .nullable(),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface LicenceEntry {
  spdxId: string;
  name: string;
  count: number;
}

export interface LicencesData {
  licences: LicenceEntry[];
  totalRepos: number;
  unlicensed: number;
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = gql`
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
          licenseInfo {
            spdxId
            name
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchLicences(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  limit: number,
  repos: ReposConfig,
): Promise<LicencesData> {
  const query = applyPublicFilter(QUERY, repos);
  const counts = new Map<string, { name: string; count: number }>();
  let totalRepos = 0;
  let hasNextPage = true;
  const cursor: string | null = null;

  while (hasNextPage) {
    const raw = await api.graphql(query, {
      login: user,
      first: 100,
      after: cursor,
    });
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for licences: ${parsed.error.message}`,
      );
    }

    for (const repo of parsed.data.user.repositories.nodes) {
      totalRepos++;
      if (repo.licenseInfo !== null) {
        const key = repo.licenseInfo.spdxId;
        const existing = counts.get(key);
        if (existing !== undefined) {
          existing.count++;
        } else {
          counts.set(key, { name: repo.licenseInfo.name, count: 1 });
        }
      }
    }

    hasNextPage = false; // 100 repos is sufficient
  }

  const licences = [...counts.entries()]
    .map(([spdxId, { name, count }]) => ({ spdxId, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  const licensed = licences.reduce((sum, l) => sum + l.count, 0);
  const unlicensed = totalRepos - licensed;

  return { licences, totalRepos, unlicensed };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const licencesSource: DataSource<LicencesConfig, LicencesData> = {
  id: "licenses",
  configSchema: LicencesConfig,
  async fetch(ctx, config) {
    return await fetchLicences(ctx.api, ctx.user, config.limit, ctx.repos);
  },
};
