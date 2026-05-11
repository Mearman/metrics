/**
 * Achievements plugin — data source.
 *
 * Fetches user statistics used to derive achievements and badges.
 */

const ACHIEVEMENTS_QUERY = `
  query($login: String!) {
    user(login: $login) {
      followers { totalCount }
      following { totalCount }
      repositories(privacy: PUBLIC, ownerAffiliations: OWNER) { totalCount }
      gists { totalCount }
      issues { totalCount }
      pullRequests { totalCount }
      contributionsCollection {
        totalCommitContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
      }
      starredRepositories { totalCount }
      watching { totalCount }
    }
  }
` as const;

export interface AchievementStats {
  followers: number;
  following: number;
  publicRepos: number;
  gists: number;
  issues: number;
  pullRequests: number;
  totalCommits: number;
  totalReviews: number;
  totalRepoContributions: number;
  starred: number;
  watching: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: "X" | "S" | "A" | "B" | "C";
}

export interface AchievementsData {
  stats: AchievementStats;
  achievements: Achievement[];
}

interface GraphQLResponse {
  user: {
    followers: { totalCount: number };
    following: { totalCount: number };
    repositories: { totalCount: number };
    gists: { totalCount: number };
    issues: { totalCount: number };
    pullRequests: { totalCount: number };
    contributionsCollection: {
      totalCommitContributions: number;
      totalPullRequestReviewContributions: number;
      totalRepositoryContributions: number;
    };
    starredRepositories: { totalCount: number };
    watching: { totalCount: number };
  };
}

/** Derive achievements from user statistics. */
function deriveAchievements(stats: AchievementStats): Achievement[] {
  const achievements: Achievement[] = [];

  // Commit milestones
  if (stats.totalCommits >= 10000)
    achievements.push({
      id: "commits-10k",
      title: "10K Commits",
      description: `${String(stats.totalCommits)} total commits`,
      icon: "git-commit",
      tier: "X",
    });
  else if (stats.totalCommits >= 1000)
    achievements.push({
      id: "commits-1k",
      title: "1K Commits",
      description: `${String(stats.totalCommits)} total commits`,
      icon: "git-commit",
      tier: "S",
    });
  else if (stats.totalCommits >= 100)
    achievements.push({
      id: "commits-100",
      title: "100 Commits",
      description: `${String(stats.totalCommits)} total commits`,
      icon: "git-commit",
      tier: "A",
    });

  // Stars
  if (stats.starred >= 1000)
    achievements.push({
      id: "starer-1k",
      title: "Star Gazer",
      description: `${String(stats.starred)} starred repos`,
      icon: "star",
      tier: "S",
    });
  else if (stats.starred >= 100)
    achievements.push({
      id: "starer-100",
      title: "Star Gazer",
      description: `${String(stats.starred)} starred repos`,
      icon: "star",
      tier: "A",
    });

  // Followers
  if (stats.followers >= 100)
    achievements.push({
      id: "followers-100",
      title: "Centurion",
      description: `${String(stats.followers)} followers`,
      icon: "people",
      tier: "S",
    });
  else if (stats.followers >= 10)
    achievements.push({
      id: "followers-10",
      title: "Rising Star",
      description: `${String(stats.followers)} followers`,
      icon: "people",
      tier: "A",
    });

  // Pull Requests
  if (stats.pullRequests >= 100)
    achievements.push({
      id: "pr-100",
      title: "Pull Request Master",
      description: `${String(stats.pullRequests)} pull requests`,
      icon: "git-pull-request",
      tier: "S",
    });
  else if (stats.pullRequests >= 10)
    achievements.push({
      id: "pr-10",
      title: "Pull Requester",
      description: `${String(stats.pullRequests)} pull requests`,
      icon: "git-pull-request",
      tier: "A",
    });

  // Repositories
  if (stats.publicRepos >= 100)
    achievements.push({
      id: "repos-100",
      title: "Repo Centurion",
      description: `${String(stats.publicRepos)} public repos`,
      icon: "repo",
      tier: "S",
    });
  else if (stats.publicRepos >= 10)
    achievements.push({
      id: "repos-10",
      title: "Repo Builder",
      description: `${String(stats.publicRepos)} public repos`,
      icon: "repo",
      tier: "A",
    });

  return achievements;
}

/**
 * Fetch user stats and derive achievements.
 */
export async function fetchAchievements(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
): Promise<AchievementsData> {
  const data: GraphQLResponse = await api.graphql<GraphQLResponse>(
    ACHIEVEMENTS_QUERY,
    { login: user },
  );

  const u = data.user;
  const stats: AchievementStats = {
    followers: u.followers.totalCount,
    following: u.following.totalCount,
    publicRepos: u.repositories.totalCount,
    gists: u.gists.totalCount,
    issues: u.issues.totalCount,
    pullRequests: u.pullRequests.totalCount,
    totalCommits: u.contributionsCollection.totalCommitContributions,
    totalReviews: u.contributionsCollection.totalPullRequestReviewContributions,
    totalRepoContributions:
      u.contributionsCollection.totalRepositoryContributions,
    starred: u.starredRepositories.totalCount,
    watching: u.watching.totalCount,
  };

  return { stats, achievements: deriveAchievements(stats) };
}
