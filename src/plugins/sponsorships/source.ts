/**
 * Sponsorships plugin — data source.
 *
 * Fetches sponsorships the user funds. Requires PAT with read:user scope.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const SponsorshipsConfig = z.object({
  /** Avatar size in px */
  size: z.int().min(8).max(64).default(28),
  /** Maximum sponsorships to display */
  limit: z.int().min(1).max(100).default(20),
});
export type SponsorshipsConfig = z.infer<typeof SponsorshipsConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    sponsorshipsAsSponsor: z.object({
      totalCount: z.number(),
      nodes: z.array(
        z.object({
          sponsorEntity: z.object({
            login: z.string().trim(),
            avatarUrl: z.string().trim(),
          }),
          tier: z.object({ monthlyPriceInDollars: z.number() }).nullable(),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface SponsorshipEntry {
  login: string;
  avatarUrl: string;
  amount: number | null;
}

export interface SponsorshipsData {
  sponsorships: SponsorshipEntry[];
  totalAmount: number;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
  query($login: String!, $size: Int!, $first: Int!) {
    user(login: $login) {
      sponsorshipsAsSponsor(first: $first) {
        totalCount
        nodes {
          sponsorEntity {
            ... on User { login avatarUrl(size: $size) }
            ... on Organization { login avatarUrl(size: $size) }
          }
          tier { monthlyPriceInDollars }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchSponsorships(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  size: number,
  limit: number,
): Promise<SponsorshipsData> {
  const raw = await api.graphql(QUERY, { login: user, size, first: limit });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for sponsorships: ${parsed.error.message}`,
    );
  }

  const sponsorships = parsed.data.user.sponsorshipsAsSponsor.nodes.map(
    (node) => ({
      login: node.sponsorEntity.login,
      avatarUrl: node.sponsorEntity.avatarUrl,
      amount: node.tier?.monthlyPriceInDollars ?? null,
    }),
  );

  const totalAmount = sponsorships.reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return {
    sponsorships,
    totalAmount,
    totalCount: parsed.data.user.sponsorshipsAsSponsor.totalCount,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const sponsorshipsSource: DataSource<
  SponsorshipsConfig,
  SponsorshipsData
> = {
  id: "sponsorships",
  configSchema: SponsorshipsConfig,
  async fetch(ctx, config) {
    return await fetchSponsorships(
      ctx.api,
      ctx.user,
      config.size,
      config.limit,
    );
  },
};
