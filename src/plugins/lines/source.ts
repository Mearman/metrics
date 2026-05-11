/**
 * Lines plugin — data source.
 *
 * Fetches lines of code statistics from the user's repositories.
 */

const REPO_LANGUAGES_QUERY = `
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
          name
          languages(first: 20) {
            edges {
              size
              node {
                name
              }
            }
          }
        }
      }
    }
  }
` as const;

export interface RepoLines {
  name: string;
  totalBytes: number;
  languages: { name: string; bytes: number }[];
}

export interface LinesData {
  repos: RepoLines[];
  totalBytes: number;
}

interface GraphQLResponse {
  user: {
    repositories: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      nodes: {
        name: string;
        languages: {
          edges: {
            size: number;
            node: {
              name: string;
            };
          }[];
        };
      }[];
    };
  };
}

/**
 * Fetch lines of code data (approximated from language byte sizes).
 */
export async function fetchLines(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
  limit = 4,
): Promise<LinesData> {
  const repos: RepoLines[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  let totalBytes = 0;

  while (hasNextPage && repos.length < limit) {
    const data: GraphQLResponse = await api.graphql<GraphQLResponse>(
      REPO_LANGUAGES_QUERY,
      {
        login: user,
        first: Math.min(limit - repos.length, 100),
        after: cursor,
      },
    );

    const result = data.user.repositories;

    for (const repo of result.nodes) {
      const languages = repo.languages.edges.map((edge) => ({
        name: edge.node.name,
        bytes: edge.size,
      }));
      const repoTotal = languages.reduce((sum, l) => sum + l.bytes, 0);

      if (repoTotal > 0) {
        repos.push({ name: repo.name, totalBytes: repoTotal, languages });
        totalBytes += repoTotal;
      }
    }

    hasNextPage = result.pageInfo.hasNextPage;
    cursor = result.pageInfo.endCursor;
  }

  return { repos: repos.slice(0, limit), totalBytes };
}
