/**
 * Introduction plugin — data source.
 *
 * Fetches user profile data for the introduction card.
 * Uses the same GraphQL query structure as the base plugin.
 *
 * Zod validates the GraphQL response at runtime — no generic
 * type assertions on api.graphql() calls.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const IntroductionConfig = z.object({
  text: z.string().trim().optional(),
});

export type IntroductionConfig = z.infer<typeof IntroductionConfig>;

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const PROFILE_QUERY = `
  query($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl(size: 200)
      bio
      company
      location
      twitterUsername
      websiteUrl
      createdAt
    }
  }
` as const;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ProfileResponseSchema = z.object({
  user: z.object({
    name: z.string().trim(),
    login: z.string().trim(),
    avatarUrl: z.string().trim(),
    bio: z.string().trim().nullable(),
    company: z.string().trim().nullable(),
    location: z.string().trim().nullable(),
    twitterUsername: z.string().trim().nullable(),
    websiteUrl: z.string().trim().nullable(),
    createdAt: z.string().trim(),
  }),
});

// ---------------------------------------------------------------------------
// Data type
// ---------------------------------------------------------------------------

export interface IntroductionData {
  name: string;
  login: string;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  twitter: string | null;
  website: string | null;
  joinedAt: string;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchIntroduction(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
): Promise<IntroductionData> {
  const raw = await api.graphql(PROFILE_QUERY, { login: user });
  const parsed = ProfileResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for introduction: ${parsed.error.message}`,
    );
  }

  const u = parsed.data.user;
  return {
    name: u.name,
    login: u.login,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    company: u.company,
    location: u.location,
    twitter: u.twitterUsername,
    website: u.websiteUrl,
    joinedAt: u.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const introductionSource: DataSource<
  IntroductionConfig,
  IntroductionData
> = {
  id: "introduction",
  configSchema: IntroductionConfig,
  async fetch(ctx) {
    return await fetchIntroduction(ctx.api, ctx.user);
  },
};
