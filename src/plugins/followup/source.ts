/**
 * Followup plugin — data source.
 *
 * Fetches issue and PR status across user repositories.
 * Shows open/closed issue ratio and open/merged PR ratio.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";
import { applyPublicFilter } from "../../repos/graphql.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const FollowupConfig = z.object({
  sections: z.array(z.enum(["repositories", "user"])).default(["repositories"]),
  indepth: z.boolean().default(false),
  /** Include archived repositories */
  archived: z.boolean().default(true),
});

export type FollowupConfig = z.infer<typeof FollowupConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface FollowupSection {
  title: string;
  issues: { open: number; closed: number };
  pullRequests: { open: number; merged: number; closed: number };
}

export interface FollowupData {
  sections: FollowupSection[];
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const REPOS_QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    repositories(
      first: $limit
      privacy: PUBLIC
      ownerAffiliations: [OWNER]
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        issues(states: [OPEN]) { totalCount }
        closedIssues: issues(states: [CLOSED]) { totalCount }
        pullRequests(states: [OPEN]) { totalCount }
        mergedPullRequests: pullRequests(states: [MERGED]) { totalCount }
        closedPullRequests: pullRequests(states: [CLOSED]) { totalCount }
      }
    }
  }
}`;

const USER_QUERY = gql`
  query ($login: String!) {
    user(login: $login) {
      openIssues: issues(states: [OPEN], first: 0) {
        totalCount
      }
      closedIssues: issues(states: [CLOSED], first: 0) {
        totalCount
      }
      openPRs: pullRequests(states: [OPEN], first: 0) {
        totalCount
      }
      mergedPRs: pullRequests(states: [MERGED], first: 0) {
        totalCount
      }
      closedPRs: pullRequests(states: [CLOSED], first: 0) {
        totalCount
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Zod response schemas
// ---------------------------------------------------------------------------

const TotalCount = z.object({ totalCount: z.number() });

const ReposResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          issues: TotalCount,
          closedIssues: TotalCount,
          pullRequests: TotalCount,
          mergedPullRequests: TotalCount,
          closedPullRequests: TotalCount,
        }),
      ),
    }),
  }),
});

const UserResponseSchema = z.object({
  user: z.object({
    openIssues: TotalCount,
    closedIssues: TotalCount,
    openPRs: TotalCount,
    mergedPRs: TotalCount,
    closedPRs: TotalCount,
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchFollowup(
  ctx: FetchContext,
  config: FollowupConfig,
): Promise<FollowupData> {
  const reposQuery = applyPublicFilter(REPOS_QUERY, ctx.repos);

  const sections: FollowupSection[] = [];

  if (config.sections.includes("repositories")) {
    const raw = await ctx.api.graphql(reposQuery, {
      login: ctx.user,
      limit: 100,
    });
    const parsed = ReposResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for followup repos: ${parsed.error.message}`,
      );
    }

    let openIssues = 0;
    let closedIssues = 0;
    let openPRs = 0;
    let mergedPRs = 0;
    let closedPRs = 0;

    for (const repo of parsed.data.user.repositories.nodes) {
      openIssues += repo.issues.totalCount;
      closedIssues += repo.closedIssues.totalCount;
      openPRs += repo.pullRequests.totalCount;
      mergedPRs += repo.mergedPullRequests.totalCount;
      closedPRs += repo.closedPullRequests.totalCount;
    }

    sections.push({
      title: "Issues and PRs on your repositories",
      issues: { open: openIssues, closed: closedIssues },
      pullRequests: { open: openPRs, merged: mergedPRs, closed: closedPRs },
    });
  }

  if (config.sections.includes("user")) {
    const raw = await ctx.api.graphql(USER_QUERY, { login: ctx.user });
    const parsed = UserResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for followup user: ${parsed.error.message}`,
      );
    }

    sections.push({
      title: "Your issues and PRs",
      issues: {
        open: parsed.data.user.openIssues.totalCount,
        closed: parsed.data.user.closedIssues.totalCount,
      },
      pullRequests: {
        open: parsed.data.user.openPRs.totalCount,
        merged: parsed.data.user.mergedPRs.totalCount,
        closed: parsed.data.user.closedPRs.totalCount,
      },
    });
  }

  return { sections };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const followupSource: DataSource<FollowupConfig, FollowupData> = {
  id: "followup",
  configSchema: FollowupConfig,
  async fetch(ctx, config) {
    return await fetchFollowup(ctx, config);
  },

  isEmpty(data) {
    return data.sections.length === 0;
  },
};
