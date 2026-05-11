/**
 * People plugin — data source.
 *
 * Fetches followers and following users from GitHub.
 */

import * as Zod from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const PeopleConfig = Zod.object({
  limit: Zod.int().min(0).max(100).default(24),
  size: Zod.int().min(8).max(64).default(28),
  types: Zod.array(Zod.enum(["followers", "following"])).default([
    "followers",
    "following",
  ]),
});

export type PeopleConfig = Zod.infer<typeof PeopleConfig>;

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
// GraphQL query
// ---------------------------------------------------------------------------

const FOLLOWERS_QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    followers(first: $limit) {
      totalCount
      nodes {
        login
        avatarUrl
      }
    }
  }
}`;

const FOLLOWING_QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    following(first: $limit) {
      totalCount
      nodes {
        login
        avatarUrl
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

interface FollowersResult {
  user: {
    followers: {
      totalCount: number;
      nodes: { login: string; avatarUrl: string }[];
    };
  };
}

interface FollowingResult {
  user: {
    following: {
      totalCount: number;
      nodes: { login: string; avatarUrl: string }[];
    };
  };
}

export async function fetchPeople(
  ctx: FetchContext,
  config: PeopleConfig,
): Promise<PeopleData> {
  const sections: PeopleSection[] = [];

  if (config.types.includes("followers")) {
    const result = await ctx.api.graphql<FollowersResult>(FOLLOWERS_QUERY, {
      login: ctx.user,
      limit: config.limit,
    });

    sections.push({
      type: "followers",
      totalCount: result.user.followers.totalCount,
      people: result.user.followers.nodes.map((n) => ({
        login: n.login,
        avatarUrl: n.avatarUrl,
      })),
    });
  }

  if (config.types.includes("following")) {
    const result = await ctx.api.graphql<FollowingResult>(FOLLOWING_QUERY, {
      login: ctx.user,
      limit: config.limit,
    });

    sections.push({
      type: "following",
      totalCount: result.user.following.totalCount,
      people: result.user.following.nodes.map((n) => ({
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
};
