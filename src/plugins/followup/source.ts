/**
 * Followup plugin — data source.
 *
 * Fetches issue and PR status across user repositories.
 * Shows open/closed issue ratio and open/merged PR ratio.
 */

import * as Zod from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const FollowupConfig = Zod.object({
  sections: Zod.array(Zod.enum(["repositories", "user"])).default([
    "repositories",
  ]),
  indepth: Zod.boolean().default(false),
});

export type FollowupConfig = Zod.infer<typeof FollowupConfig>;

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

const USER_QUERY = `
query($login: String!) {
  user(login: $login) {
    openIssues: issues(states: [OPEN], first: 0) { totalCount }
    closedIssues: issues(states: [CLOSED], first: 0) { totalCount }
    openPRs: pullRequests(states: [OPEN], first: 0) { totalCount }
    mergedPRs: pullRequests(states: [MERGED], first: 0) { totalCount }
    closedPRs: pullRequests(states: [CLOSED], first: 0) { totalCount }
  }
}`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchFollowup(
  ctx: FetchContext,
  config: FollowupConfig,
): Promise<FollowupData> {
  const sections: FollowupSection[] = [];

  if (config.sections.includes("repositories")) {
    const result = await ctx.api.graphql<{
      user: {
        repositories: {
          nodes: {
            issues: { totalCount: number };
            closedIssues: { totalCount: number };
            pullRequests: { totalCount: number };
            mergedPullRequests: { totalCount: number };
            closedPullRequests: { totalCount: number };
          }[];
        };
      };
    }>(REPOS_QUERY, { login: ctx.user, limit: 100 });

    let openIssues = 0;
    let closedIssues = 0;
    let openPRs = 0;
    let mergedPRs = 0;
    let closedPRs = 0;

    for (const repo of result.user.repositories.nodes) {
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
    const result = await ctx.api.graphql<{
      user: {
        openIssues: { totalCount: number };
        closedIssues: { totalCount: number };
        openPRs: { totalCount: number };
        mergedPRs: { totalCount: number };
        closedPRs: { totalCount: number };
      };
    }>(USER_QUERY, { login: ctx.user });

    sections.push({
      title: "Your issues and PRs",
      issues: {
        open: result.user.openIssues.totalCount,
        closed: result.user.closedIssues.totalCount,
      },
      pullRequests: {
        open: result.user.openPRs.totalCount,
        merged: result.user.mergedPRs.totalCount,
        closed: result.user.closedPRs.totalCount,
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
};
