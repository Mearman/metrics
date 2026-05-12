/**
 * Projects plugin — data source.
 *
 * Fetches GitHub Projects v2 boards for the user. Shows board
 * titles, descriptions, and item counts.
 *
 * Works with github.token for user-owned projects.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const ProjectsConfig = z.object({
  /** Maximum projects to display */
  limit: z.int().min(1).max(20).default(6),
  /** Show project descriptions */
  descriptions: z.boolean().default(false),
});
export type ProjectsConfig = z.infer<typeof ProjectsConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    projectsV2: z.object({
      totalCount: z.number(),
      nodes: z.array(
        z.object({
          title: z.string().trim(),
          shortDescription: z.string().trim().nullable(),
          items: z.object({
            totalCount: z.number(),
          }),
        }),
      ),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface ProjectEntry {
  title: string;
  description: string;
  itemCount: number;
}

export interface ProjectsData {
  totalProjects: number;
  projects: ProjectEntry[];
}

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const QUERY = `
  query($login: String!, $first: Int!) {
    user(login: $login) {
      projectsV2(first: $first) {
        totalCount
        nodes {
          title
          shortDescription
          items {
            totalCount
          }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchProjects(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  limit: number,
): Promise<ProjectsData> {
  const raw = await api.graphql(QUERY, {
    login: user,
    first: limit,
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for projects: ${parsed.error.message}`,
    );
  }

  const projects = parsed.data.user.projectsV2.nodes
    .filter((p) => p.items.totalCount > 0)
    .map((p) => ({
      title: p.title,
      description: p.shortDescription ?? "",
      itemCount: p.items.totalCount,
    }));

  return {
    totalProjects: parsed.data.user.projectsV2.totalCount,
    projects,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const projectsSource: DataSource<ProjectsConfig, ProjectsData> = {
  id: "projects",
  configSchema: ProjectsConfig,
  async fetch(ctx, config) {
    return await fetchProjects(ctx.api, ctx.user, config.limit);
  },
};
