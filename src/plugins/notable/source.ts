/**
 * Notable plugin — data source.
 *
 * Fetches organisations where the user has notable contributions.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const NotableConfig = z.object({
  indepth: z.boolean().default(false),
  /** Number of organisations to fetch */
  from: z.int().min(1).default(5),
  /** Account type filter: all, organisation, user */
  types: z.enum(["all", "organization", "user"]).default("organization"),
  /** Include own repositories */
  self: z.boolean().default(false),
});

export type NotableConfig = z.infer<typeof NotableConfig>;

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
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    organizations: z.object({
      nodes: z.array(
        z.object({
          name: z.string().trim(),
          avatarUrl: z.string().trim(),
          url: z.string().trim(),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchNotable(
  ctx: FetchContext,
  config: NotableConfig,
): Promise<NotableData> {
  const raw = await ctx.api.graphql(QUERY, {
    login: ctx.user,
    limit: config.from,
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for notable: ${parsed.error.message}`,
    );
  }

  const contributions: NotableContribution[] =
    parsed.data.user.organizations.nodes.map((org) => ({
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
