/**
 * Repositories plugin — data source.
 *
 * Fetches pinned and featured repositories from GitHub.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const RepositoriesConfig = z.object({
  pinned: z.int().min(0).max(6).default(0),
  featured: z.array(z.string().trim()).default([]),
  starred: z.int().min(0).max(100).default(0),
  order: z
    .array(z.enum(["featured", "pinned", "starred"]))
    .default(["featured", "pinned", "starred"]),
});

export type RepositoriesConfig = z.infer<typeof RepositoriesConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

type SortingKey = "featured" | "pinned" | "starred";

export interface RepositoryInfo {
  nameWithOwner: string;
  description: string | null;
  isFork: boolean;
  stargazerCount: number;
  forkCount: number;
  issues: { totalCount: number };
  pullRequests: { totalCount: number };
  primaryLanguage: { name: string; color: string } | null;
  licenseInfo: { spdxId: string; name: string } | null;
  createdAt: string;
  sorting: SortingKey;
}

export interface RepositoriesData {
  list: RepositoryInfo[];
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const PINNED_QUERY = `
query($login: String!, $limit: Int!) {
  user(login: $login) {
    pinnedItems(types: REPOSITORY, first: $limit) {
      edges {
        node {
          ... on Repository {
            createdAt
            description
            forkCount
            isFork
            issues { totalCount }
            nameWithOwner
            licenseInfo { spdxId name }
            pullRequests { totalCount }
            stargazerCount
            primaryLanguage { name color }
          }
        }
      }
    }
  }
}`;

const REPO_QUERY = `
query($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    createdAt
    description
    forkCount
    isFork
    issues { totalCount }
    nameWithOwner
    licenseInfo { spdxId name }
    pullRequests { totalCount }
    stargazerCount
    primaryLanguage { name color }
  }
}`;

const STARRED_QUERY = `
query($login: String!, $limit: Int!, $affiliations: [RepositoryAffiliation]) {
  user(login: $login) {
    repositories(
      first: $limit
      orderBy: { field: STARGAZERS, direction: DESC }
      ownerAffiliations: $affiliations
      privacy: PUBLIC
    ) {
      nodes {
        createdAt
        description
        forkCount
        isFork
        issues { totalCount }
        nameWithOwner
        licenseInfo { spdxId name }
        pullRequests { totalCount }
        stargazerCount
        primaryLanguage { name color }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RepoNode {
  createdAt: string;
  description: string | null;
  forkCount: number;
  isFork: boolean;
  issues: { totalCount: number };
  nameWithOwner: string;
  licenseInfo: { spdxId: string; name: string } | null;
  pullRequests: { totalCount: number };
  stargazerCount: number;
  primaryLanguage: { name: string; color: string } | null;
}

function formatRepo(node: RepoNode, sorting: SortingKey): RepositoryInfo {
  return {
    nameWithOwner: node.nameWithOwner,
    description: node.description,
    isFork: node.isFork,
    stargazerCount: node.stargazerCount,
    forkCount: node.forkCount,
    issues: { totalCount: node.issues.totalCount },
    pullRequests: { totalCount: node.pullRequests.totalCount },
    primaryLanguage: node.primaryLanguage,
    licenseInfo: node.licenseInfo,
    createdAt: node.createdAt,
    sorting,
  };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchRepositories(
  ctx: FetchContext,
  config: RepositoriesConfig,
): Promise<RepositoriesData> {
  const list: RepositoryInfo[] = [];
  const processed = new Set<string>();

  // Featured repositories
  for (const repoSpec of config.featured) {
    const match = /^(?:(?<owner>[\s\S]*)[/])?(?<name>[\s\S]+)$/.exec(repoSpec);
    if (match?.groups === undefined) continue;
    const { owner, name } = match.groups;
    const repoOwner = owner ?? ctx.user;

    const result = await ctx.api.graphql<{ repository: RepoNode }>(REPO_QUERY, {
      owner: repoOwner,
      name,
    });

    if (!processed.has(result.repository.nameWithOwner)) {
      list.push(formatRepo(result.repository, "featured"));
      processed.add(result.repository.nameWithOwner);
    }
  }

  // Pinned repositories
  if (config.pinned > 0) {
    const result = await ctx.api.graphql<{
      user: {
        pinnedItems: {
          edges: { node: RepoNode | null }[];
        };
      };
    }>(PINNED_QUERY, { login: ctx.user, limit: config.pinned });

    for (const edge of result.user.pinnedItems.edges) {
      if (edge.node === null) continue;
      if (processed.has(edge.node.nameWithOwner)) continue;
      processed.add(edge.node.nameWithOwner);
      list.push(formatRepo(edge.node, "pinned"));
    }
  }

  // Most starred repositories
  if (config.starred > 0) {
    const result = await ctx.api.graphql<{
      user: {
        repositories: {
          nodes: RepoNode[];
        };
      };
    }>(STARRED_QUERY, {
      login: ctx.user,
      limit: Math.min(config.starred + 10, 100),
      affiliations: ["OWNER"],
    });

    let count = 0;
    for (const node of result.user.repositories.nodes) {
      if (processed.has(node.nameWithOwner)) continue;
      processed.add(node.nameWithOwner);
      list.push(formatRepo(node, "starred"));
      if (++count >= config.starred) break;
    }
  }

  // Sort by configured order
  list.sort(
    (a, b) => config.order.indexOf(a.sorting) - config.order.indexOf(b.sorting),
  );

  return { list };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const repositoriesSource: DataSource<
  RepositoriesConfig,
  RepositoriesData
> = {
  id: "repositories",
  configSchema: RepositoriesConfig,
  async fetch(ctx, config) {
    return await fetchRepositories(ctx, config);
  },
};
