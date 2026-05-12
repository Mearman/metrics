/**
 * Reactions plugin — data source.
 *
 * Fetches recent reaction statistics from the user's issues
 * and pull requests. Uses GraphQL with Zod validation for
 * runtime type safety.
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
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    issues: z.object({
      nodes: z.array(
        z.object({
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
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch reaction data from the user's recent issues.
 *
 * Uses the GitHub GraphQL API to find issues with reactions.
 */
export async function fetchReactions(
  api: ApiClient,
  user: string,
  config: ReactionsConfig,
): Promise<ReactionsData> {
  const since = new Date();
  since.setDate(since.getDate() - config.days);

  const query = `
    query($login: String!, $since: DateTime!) {
      user(login: $login) {
        issues(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}, filterBy: {since: $since}) {
          nodes {
            title
            url
            repository {
              nameWithOwner
            }
            reactions {
              totalCount
            }
            reactionGroups {
              content
              users {
                totalCount
              }
            }
          }
        }
      }
    }
  `;

  const raw = await api.graphql(query, {
    login: user,
    since: since.toISOString(),
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for reactions: ${parsed.error.message}`,
    );
  }

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

  const reactionMap: Record<string, string> = {
    THUMBS_UP: "+1",
    THUMBS_DOWN: "-1",
    LAUGH: "laugh",
    HOORAY: "hooray",
    CONFUSED: "confused",
    HEART: "heart",
    ROCKET: "rocket",
    EYES: "eyes",
  };

  for (const issue of parsed.data.user.issues.nodes) {
    scanned++;

    if (issue.reactions.totalCount === 0) continue;

    let plusOne = 0;
    let minusOne = 0;
    let laughCount = 0;
    let hoorayCount = 0;
    let confusedCount = 0;
    let heartCount = 0;
    let rocketCount = 0;
    let eyesCount = 0;

    for (const group of issue.reactionGroups) {
      const key = reactionMap[group.content];
      if (key === "+1") plusOne = group.users.totalCount;
      else if (key === "-1") minusOne = group.users.totalCount;
      else if (key === "laugh") laughCount = group.users.totalCount;
      else if (key === "hooray") hoorayCount = group.users.totalCount;
      else if (key === "confused") confusedCount = group.users.totalCount;
      else if (key === "heart") heartCount = group.users.totalCount;
      else if (key === "rocket") rocketCount = group.users.totalCount;
      else if (key === "eyes") eyesCount = group.users.totalCount;
    }

    const reactionSummary = {
      total_count: issue.reactions.totalCount,
      "+1": plusOne,
      "-1": minusOne,
      laugh: laughCount,
      hooray: hoorayCount,
      confused: confusedCount,
      heart: heartCount,
      rocket: rocketCount,
      eyes: eyesCount,
    };

    items.push({
      repository: issue.repository.nameWithOwner,
      type: "Issue",
      title: issue.title,
      reactions: reactionSummary,
    });

    for (const [key, value] of Object.entries(reactionSummary)) {
      const current = totals[key];
      if (current !== undefined) {
        totals[key] = current + value;
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
