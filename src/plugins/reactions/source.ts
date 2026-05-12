/**
 * Reactions plugin — data source.
 *
 * Fetches recent reaction statistics from the user's issues
 * and pull requests. Uses separate GraphQL queries for each type
 * since GitHub GraphQL does not support a unified IssueOrPullRequest
 * query with reaction fields.
 */

import * as z from "zod";
import type { ApiClient } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const ReactionsConfig = z.object({
  /** Number of days to look back */
  days: z.int().min(1).max(365).default(30),
  /** Maximum number of reaction summaries to include */
  limit: z.int().min(1).max(50).default(10),
});
export type ReactionsConfig = z.infer<typeof ReactionsConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface ReactionSummary {
  repository: string;
  type: string;
  title: string;
  reactions: {
    total_count: number;
    "+1": number;
    "-1": number;
    laugh: number;
    hooray: number;
    confused: number;
    heart: number;
    rocket: number;
    eyes: number;
  };
}

export interface ReactionsData {
  /** Total reaction counts across all items */
  totals: Record<string, number>;
  /** Individual reaction summaries */
  items: ReactionSummary[];
  /** Total items scanned */
  scanned: number;
}

// ---------------------------------------------------------------------------
// Zod response schema (shared by issues and PRs)
// ---------------------------------------------------------------------------

const ItemSchema = z.object({
  title: z.string().trim(),
  url: z.string().trim(),
  repository: z.object({
    nameWithOwner: z.string().trim(),
  }),
  reactions: z.object({
    totalCount: z.number(),
  }),
  reactionGroups: z.array(
    z.object({
      content: z.string().trim(),
      users: z.object({ totalCount: z.number() }),
    }),
  ),
});

const IssuesResponseSchema = z.object({
  user: z.object({
    issues: z.object({
      nodes: z.array(ItemSchema),
    }),
  }),
});

const PullRequestsResponseSchema = z.object({
  user: z.object({
    pullRequests: z.object({
      nodes: z.array(ItemSchema),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REACTION_MAP: Record<string, string> = {
  THUMBS_UP: "+1",
  THUMBS_DOWN: "-1",
  LAUGH: "laugh",
  HOORAY: "hooray",
  CONFUSED: "confused",
  HEART: "heart",
  ROCKET: "rocket",
  EYES: "eyes",
};

function parseReactions(groups: z.infer<typeof ItemSchema>["reactionGroups"]) {
  let plusOne = 0;
  let minusOne = 0;
  let laugh = 0;
  let hooray = 0;
  let confused = 0;
  let heart = 0;
  let rocket = 0;
  let eyes = 0;

  for (const group of groups) {
    const key = REACTION_MAP[group.content];
    if (key === "+1") plusOne = group.users.totalCount;
    else if (key === "-1") minusOne = group.users.totalCount;
    else if (key === "laugh") laugh = group.users.totalCount;
    else if (key === "hooray") hooray = group.users.totalCount;
    else if (key === "confused") confused = group.users.totalCount;
    else if (key === "heart") heart = group.users.totalCount;
    else if (key === "rocket") rocket = group.users.totalCount;
    else if (key === "eyes") eyes = group.users.totalCount;
  }

  return {
    total_count: 0,
    "+1": plusOne,
    "-1": minusOne,
    laugh,
    hooray,
    confused,
    heart,
    rocket,
    eyes,
  };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch reaction data from the user's recent issues and pull requests.
 */
export async function fetchReactions(
  api: ApiClient,
  user: string,
  config: ReactionsConfig,
): Promise<ReactionsData> {
  const since = new Date();
  since.setDate(since.getDate() - config.days);
  const sinceISO = since.toISOString();

  const items: ReactionSummary[] = [];
  const totals: Record<string, number> = {
    total_count: 0,
    "+1": 0,
    "-1": 0,
    laugh: 0,
    hooray: 0,
    confused: 0,
    heart: 0,
    rocket: 0,
    eyes: 0,
  };
  let scanned = 0;

  // Fetch issues
  const issuesQuery = `
    query($login: String!, $since: DateTime!) {
      user(login: $login) {
        issues(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}, filterBy: {since: $since}) {
          nodes {
            title
            url
            repository { nameWithOwner }
            reactions { totalCount }
            reactionGroups {
              content
              users { totalCount }
            }
          }
        }
      }
    }
  `;

  const issuesRaw = await api.graphql(issuesQuery, {
    login: user,
    since: sinceISO,
  });
  const issuesParsed = IssuesResponseSchema.safeParse(issuesRaw);
  if (issuesParsed.success) {
    for (const issue of issuesParsed.data.user.issues.nodes) {
      scanned++;
      if (issue.reactions.totalCount === 0) continue;

      const reactions = parseReactions(issue.reactionGroups);
      reactions.total_count = issue.reactions.totalCount;

      items.push({
        repository: issue.repository.nameWithOwner,
        type: "Issue",
        title: issue.title,
        reactions,
      });

      for (const [key, value] of Object.entries(reactions)) {
        const current = totals[key];
        if (current !== undefined) totals[key] = current + value;
      }
    }
  }

  // Fetch pull requests
  const prsQuery = `
    query($login: String!, $since: DateTime!) {
      user(login: $login) {
        pullRequests(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            title
            url
            repository { nameWithOwner }
            reactions { totalCount }
            reactionGroups {
              content
              users { totalCount }
            }
          }
        }
      }
    }
  `;

  const prsRaw = await api.graphql(prsQuery, {
    login: user,
    since: sinceISO,
  });
  const prsParsed = PullRequestsResponseSchema.safeParse(prsRaw);
  if (prsParsed.success) {
    for (const pr of prsParsed.data.user.pullRequests.nodes) {
      scanned++;
      if (pr.reactions.totalCount === 0) continue;

      const reactions = parseReactions(pr.reactionGroups);
      reactions.total_count = pr.reactions.totalCount;

      items.push({
        repository: pr.repository.nameWithOwner,
        type: "PR",
        title: pr.title,
        reactions,
      });

      for (const [key, value] of Object.entries(reactions)) {
        const current = totals[key];
        if (current !== undefined) totals[key] = current + value;
      }
    }
  }

  // Sort by reaction count descending
  items.sort((a, b) => b.reactions.total_count - a.reactions.total_count);

  return {
    totals,
    items: items.slice(0, config.limit),
    scanned,
  };
}
