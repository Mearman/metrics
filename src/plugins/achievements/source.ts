/**
 * Achievements plugin — data source.
 *
 * Fetches user statistics used to derive achievements and badges.
 * Uses only fields accessible with github.token (repository-scoped).
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";

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

const TotalCount = z.object({ totalCount: z.number() });

const ResponseSchema = z.object({
  user: z.object({
    followers: TotalCount,
    following: TotalCount,
    repositories: TotalCount,
    gists: TotalCount,
    issues: TotalCount,
    pullRequests: TotalCount,
    contributionsCollection: z.object({
      totalCommitContributions: z.number(),
    }),
    starredRepositories: TotalCount,
    watching: TotalCount,
  }),
});

/** Derive achievements from user statistics. */
function deriveAchievements(stats: AchievementStats): Achievement[] {
  const achievements: Achievement[] = [];

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

  if (stats.issues >= 100)
    achievements.push({
      id: "issues-100",
      title: "Issue Tracker",
      description: `${String(stats.issues)} issues opened`,
      icon: "issue-opened",
      tier: "S",
    });
  else if (stats.issues >= 10)
    achievements.push({
      id: "issues-10",
      title: "Issue Opener",
      description: `${String(stats.issues)} issues opened`,
      icon: "issue-opened",
      tier: "A",
    });

  return achievements;
}

/**
 * Fetch user stats and derive achievements.
 */
export async function fetchAchievements(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
): Promise<AchievementsData> {
  const raw = await api.graphql(ACHIEVEMENTS_QUERY, { login: user });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for achievements: ${parsed.error.message}`,
    );
  }

  const u = parsed.data.user;
  const stats: AchievementStats = {
    followers: u.followers.totalCount,
    following: u.following.totalCount,
    publicRepos: u.repositories.totalCount,
    gists: u.gists.totalCount,
    issues: u.issues.totalCount,
    pullRequests: u.pullRequests.totalCount,
    totalCommits: u.contributionsCollection.totalCommitContributions,
    starred: u.starredRepositories.totalCount,
    watching: u.watching.totalCount,
  };

  return { stats, achievements: deriveAchievements(stats) };
}
