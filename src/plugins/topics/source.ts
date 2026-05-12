/**
 * Topics plugin — data source.
 *
 * Fetches the most-used topics/tags from the user's public
 * repositories. Uses only the `repositoryTopics` field available
 * with github.token.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const TopicsConfig = z.object({
  /** Maximum topics to display */
  limit: z.int().min(1).max(50).default(20),
});
export type TopicsConfig = z.infer<typeof TopicsConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          repositoryTopics: z.object({
            nodes: z.array(
              z.object({
                topic: z.object({ name: z.string().trim() }),
              }),
            ),
          }),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface TopicEntry {
  name: string;
  count: number;
}

export interface TopicsData {
  topics: TopicEntry[];
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
  query($login: String!, $first: Int!, $after: String) {
    user(login: $login) {
      repositories(
        first: $first
        after: $after
        privacy: PUBLIC
        ownerAffiliations: OWNER
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          repositoryTopics(first: 20) {
            nodes {
              topic { name }
            }
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchTopics(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  limit: number,
): Promise<TopicsData> {
  const counts = new Map<string, number>();
  let hasNextPage = true;
  const cursor: string | null = null;

  while (hasNextPage) {
    const raw = await api.graphql(QUERY, {
      login: user,
      first: 100,
      after: cursor,
    });
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for topics: ${parsed.error.message}`,
      );
    }

    for (const repo of parsed.data.user.repositories.nodes) {
      for (const topicNode of repo.repositoryTopics.nodes) {
        const current = counts.get(topicNode.topic.name);
        if (current !== undefined) {
          counts.set(topicNode.topic.name, current + 1);
        } else {
          counts.set(topicNode.topic.name, 1);
        }
      }
    }

    hasNextPage = false; // Single page for topics — 100 repos is enough
  }

  const topics = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return { topics };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const topicsSource: DataSource<TopicsConfig, TopicsData> = {
  id: "topics",
  configSchema: TopicsConfig,
  async fetch(ctx, config) {
    return await fetchTopics(ctx.api, ctx.user, config.limit);
  },
};
