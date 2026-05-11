/**
 * Base plugin — user profile header data source.
 *
 * Fetches the user's profile information: avatar, name, bio,
 * company, location, and account statistics.
 */

const PROFILE_QUERY = `
  query($login: String!) {
    user(login: $login) {
      name
      login
      avatarUrl
      bio
      company
      location
      createdAt
      followers {
        totalCount
      }
      following {
        totalCount
      }
      repositories(privacy: PUBLIC, ownerAffiliations: OWNER) {
        totalCount
      }
      issues {
        totalCount
      }
      pullRequests {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalRepositoryContributions
      }
    }
  }
` as const;

export interface BasePluginConfig {
  sections: string[];
  indepth: boolean;
}

export interface UserProfile {
  name: string;
  login: string;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  createdAt: string;
  followers: number;
  following: number;
  publicRepositories: number;
  issues: number;
  pullRequests: number;
  totalCommits: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalRepositoryContributions: number;
}

interface GraphQLResponse {
  user: {
    name: string;
    login: string;
    avatarUrl: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    createdAt: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: { totalCount: number };
    issues: { totalCount: number };
    pullRequests: { totalCount: number };
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestContributions: number;
      totalIssueContributions: number;
      totalRepositoryContributions: number;
    };
  };
}

/**
 * Fetch user profile data from GitHub GraphQL API.
 */
export async function fetchProfile(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
): Promise<UserProfile> {
  const data = await api.graphql<GraphQLResponse>(PROFILE_QUERY, {
    login: user,
  });

  const u = data.user;
  return {
    name: u.name,
    login: u.login,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    company: u.company,
    location: u.location,
    createdAt: u.createdAt,
    followers: u.followers.totalCount,
    following: u.following.totalCount,
    publicRepositories: u.repositories.totalCount,
    issues: u.issues.totalCount,
    pullRequests: u.pullRequests.totalCount,
    totalCommits: u.contributionsCollection.totalCommitContributions,
    totalPullRequestContributions:
      u.contributionsCollection.totalPullRequestContributions,
    totalIssueContributions: u.contributionsCollection.totalIssueContributions,
    totalRepositoryContributions:
      u.contributionsCollection.totalRepositoryContributions,
  };
}
