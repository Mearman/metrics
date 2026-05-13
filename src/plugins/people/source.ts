/**
 * People plugin — data source.
 *
 * Fetches followers and following users from GitHub.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const PeopleConfig = z.object({
  limit: z.int().min(0).max(100).default(24),
  size: z.int().min(8).max(64).default(28),
  types: z
    .array(z.enum(["followers", "following"]))
    .default(["followers", "following"]),
});

export type PeopleConfig = z.infer<typeof PeopleConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface Person {
  login: string;
  avatarUrl: string;
}

export interface PeopleSection {
  type: "followers" | "following";
  totalCount: number;
  people: Person[];
}

export interface PeopleData {
  sections: PeopleSection[];
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const FOLLOWERS_QUERY = gql`
  query ($login: String!, $limit: Int!) {
    user(login: $login) {
      followers(first: $limit) {
        totalCount
        nodes {
          login
          avatarUrl
        }
      }
    }
  }
`;

const FOLLOWING_QUERY = gql`
  query ($login: String!, $limit: Int!) {
    user(login: $login) {
      following(first: $limit) {
        totalCount
        nodes {
          login
          avatarUrl
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Zod response schemas
// ---------------------------------------------------------------------------

const UserListSchema = z.object({
  totalCount: z.number(),
  nodes: z.array(
    z.object({
      login: z.string().trim(),
      avatarUrl: z.string().trim(),
    }),
  ),
});

const FollowersResponseSchema = z.object({
  user: z.object({ followers: UserListSchema }),
});

const FollowingResponseSchema = z.object({
  user: z.object({ following: UserListSchema }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchPeople(
  ctx: FetchContext,
  config: PeopleConfig,
): Promise<PeopleData> {
  const sections: PeopleSection[] = [];

  if (config.types.includes("followers")) {
    const raw = await ctx.api.graphql(FOLLOWERS_QUERY, {
      login: ctx.user,
      limit: config.limit,
    });
    const parsed = FollowersResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for followers: ${parsed.error.message}`,
      );
    }

    sections.push({
      type: "followers",
      totalCount: parsed.data.user.followers.totalCount,
      people: parsed.data.user.followers.nodes.map((n) => ({
        login: n.login,
        avatarUrl: n.avatarUrl,
      })),
    });
  }

  if (config.types.includes("following")) {
    const raw = await ctx.api.graphql(FOLLOWING_QUERY, {
      login: ctx.user,
      limit: config.limit,
    });
    const parsed = FollowingResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for following: ${parsed.error.message}`,
      );
    }

    sections.push({
      type: "following",
      totalCount: parsed.data.user.following.totalCount,
      people: parsed.data.user.following.nodes.map((n) => ({
        login: n.login,
        avatarUrl: n.avatarUrl,
      })),
    });
  }

  return { sections };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const peopleSource: DataSource<PeopleConfig, PeopleData> = {
  id: "people",
  configSchema: PeopleConfig,
  async fetch(ctx, config) {
    return await fetchPeople(ctx, config);
  },

  isEmpty(data) {
    return data.sections.length === 0;
  },
};
