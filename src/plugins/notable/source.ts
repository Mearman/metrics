/**
 * Notable plugin — data source.
 *
 * Fetches organisations where the user has notable contributions.
 */

import * as Zod from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const NotableConfig = Zod.object({
  indepth: Zod.boolean().default(false),
  from: Zod.int().min(1).default(5),
});

export type NotableConfig = Zod.infer<typeof NotableConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface NotableContribution {
  name: string;
  avatarUrl: string;
  url: string;
}

export interface NotableData {
  contributions: NotableContribution[];
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    organizations(first: $limit) {
      nodes {
        name
        avatarUrl
        url
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

interface OrgNode {
  name: string;
  avatarUrl: string;
  url: string;
}

export async function fetchNotable(
  ctx: FetchContext,
  config: NotableConfig,
): Promise<NotableData> {
  const result = await ctx.api.graphql<{
    user: {
      organizations: {
        nodes: OrgNode[];
      };
    };
  }>(QUERY, { login: ctx.user, limit: config.from });

  const contributions: NotableContribution[] =
    result.user.organizations.nodes.map((org) => ({
      name: org.name,
      avatarUrl: org.avatarUrl,
      url: org.url,
    }));

  return { contributions };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const notableSource: DataSource<NotableConfig, NotableData> = {
  id: "notable",
  configSchema: NotableConfig,
  async fetch(ctx, config) {
    return await fetchNotable(ctx, config);
  },
};
