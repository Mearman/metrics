/**
 * Repositories plugin — data source.
 *
 * Fetches pinned and featured repositories from GitHub.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";
import { applyPublicFilter } from "../../repos/graphql.ts";
import { gql } from "../../util/gql.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const RepositoriesConfig = z.object({
  pinned: z.int().min(0).max(6).default(0),
  featured: z.array(z.string().trim()).default([]),
  starred: z.int().min(0).max(100).default(0),
  order: z
    .array(z.enum(["featured", "pinned", "starred"]))
    .default(["featured", "pinned", "starred"]),
  /** Include forked repositories */
  forks: z.boolean().default(false),
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
  isPrivate: boolean;
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

const PINNED_QUERY = gql`
  query ($login: String!, $limit: Int!) {
    user(login: $login) {
      pinnedItems(types: REPOSITORY, first: $limit) {
        edges {
          node {
            ... on Repository {
              createdAt
              description
              forkCount
              isFork
              isPrivate
              issues {
                totalCount
              }
              nameWithOwner
              licenseInfo {
                spdxId
                name
              }
              pullRequests {
                totalCount
              }
              stargazerCount
              primaryLanguage {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

const REPO_QUERY = gql`
  query ($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      createdAt
      description
      forkCount
      isFork
      isPrivate
      issues {
        totalCount
      }
      nameWithOwner
      licenseInfo {
        spdxId
        name
      }
      pullRequests {
        totalCount
      }
      stargazerCount
      primaryLanguage {
        name
        color
      }
    }
  }
`;

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
        isPrivate
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
// Zod response schemas
// ---------------------------------------------------------------------------

const TotalCount = z.object({ totalCount: z.number() });

const RepoNodeSchema = z.object({
  createdAt: z.string().trim(),
  description: z.string().trim().nullable(),
  forkCount: z.number(),
  isFork: z.boolean(),
  isPrivate: z.boolean(),
  issues: TotalCount,
  nameWithOwner: z.string().trim(),
  licenseInfo: z
    .object({ spdxId: z.string().trim(), name: z.string().trim() })
    .nullable(),
  pullRequests: TotalCount,
  stargazerCount: z.number(),
  primaryLanguage: z
    .object({ name: z.string().trim(), color: z.string().trim() })
    .nullable(),
});

const RepoQuerySchema = z.object({
  repository: RepoNodeSchema,
});

const PinnedQuerySchema = z.object({
  user: z.object({
    pinnedItems: z.object({
      edges: z.array(
        z.object({
          node: RepoNodeSchema.nullable(),
        }),
      ),
    }),
  }),
});

const StarredQuerySchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(RepoNodeSchema),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRepo(
  node: z.infer<typeof RepoNodeSchema>,
  sorting: SortingKey,
): RepositoryInfo {
  return {
    nameWithOwner: node.nameWithOwner,
    description: node.description,
    isFork: node.isFork,
    isPrivate: node.isPrivate,
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

    const raw = await ctx.api.graphql(REPO_QUERY, {
      owner: repoOwner,
      name,
    });
    const parsed = RepoQuerySchema.safeParse(raw);
    if (!parsed.success) continue;

    if (!processed.has(parsed.data.repository.nameWithOwner)) {
      const repo = formatRepo(parsed.data.repository, "featured");
      if (!repo.isFork || config.forks) {
        list.push(repo);
        processed.add(parsed.data.repository.nameWithOwner);
      }
    }
  }

  // Pinned repositories
  if (config.pinned > 0) {
    const raw = await ctx.api.graphql(PINNED_QUERY, {
      login: ctx.user,
      limit: config.pinned,
    });
    const parsed = PinnedQuerySchema.safeParse(raw);
    if (parsed.success) {
      for (const edge of parsed.data.user.pinnedItems.edges) {
        if (edge.node === null) continue;
        if (processed.has(edge.node.nameWithOwner)) continue;
        const repo = formatRepo(edge.node, "pinned");
        if (!repo.isFork || config.forks) {
          processed.add(edge.node.nameWithOwner);
          list.push(repo);
        }
      }
    }
  }

  // Most starred repositories
  if (config.starred > 0) {
    const starredQuery = applyPublicFilter(STARRED_QUERY, ctx.repos);
    const raw = await ctx.api.graphql(starredQuery, {
      login: ctx.user,
      limit: Math.min(config.starred + 10, 100),
      affiliations: ["OWNER"],
    });
    const parsed = StarredQuerySchema.safeParse(raw);
    if (parsed.success) {
      let count = 0;
      for (const node of parsed.data.user.repositories.nodes) {
        if (processed.has(node.nameWithOwner)) continue;
        const repo = formatRepo(node, "starred");
        if (!repo.isFork || config.forks) {
          processed.add(node.nameWithOwner);
          list.push(repo);
          if (++count >= config.starred) break;
        }
      }
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
