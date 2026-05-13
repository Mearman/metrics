/**
 * Sponsors plugin — data source.
 *
 * Fetches GitHub Sponsors data: listing description, funding goal,
 * and sponsor avatars. Requires a PAT with read:user scope.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const SponsorsConfig = z.object({
  /** Display sections */
  sections: z
    .array(z.enum(["goal", "about", "list"]))
    .default(["goal", "list"]),
  /** Avatar size in px */
  size: z.int().min(8).max(64).default(28),
});
export type SponsorsConfig = z.infer<typeof SponsorsConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    sponsorsListing: z
      .object({
        fullDescription: z.string().trim().nullable(),
        activeGoal: z
          .object({
            percentComplete: z.number(),
            title: z.string().trim(),
            description: z.string().trim(),
          })
          .nullable(),
      })
      .nullable(),
    sponsorshipsAsMaintainer: z.object({
      totalCount: z.number(),
      nodes: z.array(
        z.object({
          privacyLevel: z.string().trim(),
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

export interface SponsorEntry {
  login: string;
  avatarUrl: string;
  amount: number | null;
  isPrivate: boolean;
}

export interface SponsorsData {
  about: string;
  goal: {
    percentComplete: number;
    title: string;
    description: string;
  } | null;
  sponsors: SponsorEntry[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = gql`
  query ($login: String!, $size: Int!) {
    user(login: $login) {
      sponsorsListing {
        fullDescription
        activeGoal {
          percentComplete
          title
          description
        }
      }
      sponsorshipsAsMaintainer(first: 100) {
        totalCount
        nodes {
          privacyLevel
          sponsorEntity {
            ... on User {
              login
              avatarUrl(size: $size)
            }
            ... on Organization {
              login
              avatarUrl(size: $size)
            }
          }
          tier {
            monthlyPriceInDollars
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchSponsors(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  size: number,
): Promise<SponsorsData> {
  const raw = await api.graphql(QUERY, { login: user, size });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for sponsors: ${parsed.error.message}`,
    );
  }

  const listing = parsed.data.user.sponsorsListing;
  const sponsorsList = parsed.data.user.sponsorshipsAsMaintainer;

  const sponsors: SponsorEntry[] = sponsorsList.nodes
    .filter((node) => node.privacyLevel !== "PRIVATE")
    .map((node) => ({
      login: node.sponsorEntity.login,
      avatarUrl: node.sponsorEntity.avatarUrl,
      amount: node.tier?.monthlyPriceInDollars ?? null,
      isPrivate: false,
    }));

  return {
    about: listing?.fullDescription ?? "",
    goal: listing?.activeGoal ?? null,
    sponsors,
    totalCount: sponsorsList.totalCount,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const sponsorsSource: DataSource<SponsorsConfig, SponsorsData> = {
  id: "sponsors",
  configSchema: SponsorsConfig,
  async fetch(ctx, config) {
    return await fetchSponsors(ctx.api, ctx.user, config.size);
  },

  isEmpty(data) {
    return data.sponsors.length === 0 && data.goal === null;
  },
};
