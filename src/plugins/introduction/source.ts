/**
 * Introduction plugin — data source.
 *
 * Fetches user profile data for the introduction card.
 * Reuses the same GraphQL query as the base plugin since
 * it needs the same profile fields.
 */

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

import * as z from "zod";

export const IntroductionConfig = z.object({
  text: z.string().trim().optional(),
});
export type IntroductionConfig = z.infer<typeof IntroductionConfig>;

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

interface GraphQLResponse {
  user: {
    name: string;
    login: string;
    avatarUrl: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    twitterUsername: string | null;
    websiteUrl: string | null;
    createdAt: string;
  };
}

/**
 * Fetch user profile for the introduction card.
 */
export async function fetchIntroduction(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
): Promise<IntroductionData> {
  const data = await api.graphql<GraphQLResponse>(PROFILE_QUERY, {
    login: user,
  });

  const u = data.user;
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
