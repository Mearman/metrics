/**
 * Traffic plugin — data source.
 *
 * Fetches repository view counts. Requires a PAT with repo scope
 * (push access to repositories).
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import { applyPublicFilter } from "../../repos/graphql.ts";
import type { ReposConfig } from "../../repos/filter.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const TrafficConfig = z.object({
  /** Maximum repositories to show */
  limit: z.int().min(1).max(30).default(8),
});
export type TrafficConfig = z.infer<typeof TrafficConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface RepoTraffic {
  name: string;
  views: number;
  uniques: number;
  isPrivate: boolean;
}

export interface TrafficData {
  repos: RepoTraffic[];
  totalViews: number;
  totalUniques: number;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const ReposResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          nameWithOwner: z.string().trim(),
          isPrivate: z.boolean(),
        }),
      ),
    }),
  }),
});

const REPOS_QUERY = gql`
  query ($login: String!, $first: Int!) {
    user(login: $login) {
      repositories(
        first: $first
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          isPrivate
        }
      }
    }
  }
`;

export async function fetchTraffic(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
    rest: {
      repos: {
        getViews(params: { owner: string; repo: string }): Promise<{
          data: { count: number; uniques: number };
        }>;
      };
    };
  },
  user: string,
  limit: number,
  repos: ReposConfig,
): Promise<TrafficData> {
  const query = applyPublicFilter(REPOS_QUERY, repos);
  const raw = await api.graphql(query, { login: user, first: 100 });
  const parsed = ReposResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for traffic repos: ${parsed.error.message}`,
    );
  }

  const repoList = parsed.data.user.repositories.nodes.map((n) => {
    const slashIndex = n.nameWithOwner.indexOf("/");
    return {
      owner: n.nameWithOwner.slice(0, slashIndex),
      repo: n.nameWithOwner.slice(slashIndex + 1),
      fullName: n.nameWithOwner,
      isPrivate: n.isPrivate,
    };
  });

  const trafficEntries: RepoTraffic[] = [];
  let totalViews = 0;
  let totalUniques = 0;

  for (const repo of repoList) {
    try {
      const response = await api.rest.repos.getViews({
        owner: repo.owner,
        repo: repo.repo,
      });
      if (response.data.count > 0) {
        trafficEntries.push({
          name: repo.fullName,
          views: response.data.count,
          uniques: response.data.uniques,
          isPrivate: repo.isPrivate,
        });
        totalViews += response.data.count;
        totalUniques += response.data.uniques;
      }
    } catch {
      // Skip repos where we don't have push access
    }
  }

  trafficEntries.sort((a, b) => b.views - a.views);

  return {
    repos: trafficEntries.slice(0, limit),
    totalViews,
    totalUniques,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const trafficSource: DataSource<TrafficConfig, TrafficData> = {
  id: "traffic",
  configSchema: TrafficConfig,
  async fetch(ctx, config) {
    return await fetchTraffic(ctx.api, ctx.user, config.limit, ctx.repos);
  },
};
