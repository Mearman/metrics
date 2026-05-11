/**
 * Languages plugin — data source.
 *
 * Fetches language breakdown from the user's repositories.
 * Supports both total and recent (last N days) breakdowns.
 */

const LANGUAGES_QUERY = `
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
          languages(first: 20) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
` as const;

export interface LanguageEntry {
  name: string;
  colour: string;
  size: number;
}

export interface LanguagesData {
  total: LanguageEntry[];
  totalBytes: number;
}

interface LanguageEdge {
  size: number;
  node: {
    name: string;
    color: string | null;
  };
}

interface RepositoryNode {
  languages: {
    edges: LanguageEdge[];
  };
}

interface GraphQLResponse {
  user: {
    repositories: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: RepositoryNode[];
    };
  };
}

/**
 * Fetch language breakdown from the user's public repositories.
 *
 * Aggregates byte sizes per language across all repos.
 */
export async function fetchLanguages(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
  options?: { limit?: number },
): Promise<LanguagesData> {
  const repoLimit = options?.limit ?? 300;
  const aggregated = new Map<string, { size: number; colour: string }>();
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const data: GraphQLResponse = await api.graphql<GraphQLResponse>(
      LANGUAGES_QUERY,
      {
        login: user,
        first: Math.min(repoLimit, 100),
        after: cursor,
      },
    );

    const repos = data.user.repositories;

    for (const repo of repos.nodes) {
      for (const edge of repo.languages.edges) {
        const name = edge.node.name;
        const existing = aggregated.get(name);
        if (existing !== undefined) {
          existing.size += edge.size;
        } else {
          aggregated.set(name, {
            size: edge.size,
            colour: edge.node.color ?? "#8b949e",
          });
        }
      }
    }

    hasNextPage = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;
  }

  // Sort by size descending
  const total = [...aggregated.entries()]
    .map(([name, { size, colour }]) => ({ name, colour, size }))
    .sort((a, b) => b.size - a.size);

  const totalBytes = total.reduce((sum, lang) => sum + lang.size, 0);

  return { total, totalBytes };
}
