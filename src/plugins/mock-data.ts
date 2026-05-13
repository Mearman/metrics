/**
 * Mock/placeholder data for all 29 plugins.
 *
 * Used when the output config includes a plugin ID in its `mock` array.
 * The pipeline skips the fetch step and uses the registered mock data.
 *
 * Every shape matches the actual Data interface from each plugin's source.
 */

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

const avatar = (login: string) =>
  `https://avatars.githubusercontent.com/${login}?s=56`;

function calendarWeeks(count: number) {
  const base = new Date("2026-04-14");
  const weeks = [];
  for (let w = 0; w < count; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(base);
      date.setDate(date.getDate() - (count - w) * 7 + d);
      const count_ = Math.max(
        0,
        Math.round(
          Math.sin(w * 0.3 + d) * 3 +
            Math.cos(w * 0.15) * 2 +
            (d >= 1 && d <= 5 ? 2 : -1),
        ),
      );
      days.push({
        date: date.toISOString().split("T")[0],
        count: count_,
        colour:
          count_ === 0
            ? "#161b22"
            : count_ <= 2
              ? "#0e4429"
              : count_ <= 5
                ? "#006d32"
                : count_ <= 8
                  ? "#26a641"
                  : "#39d353",
      });
    }
    weeks.push({ contributionDays: days });
  }
  return weeks;
}

// ---------------------------------------------------------------------------
// base — UserProfile
// ---------------------------------------------------------------------------

export const base = {
  login: "octocat",
  name: "Octocat",
  avatarUrl: avatar("octocat"),
  bio: "GitHub's mascot and demo user",
  company: "@github",
  location: "San Francisco, CA",
  createdAt: "2011-01-25T18:44:36Z",
  followers: 24_600,
  following: 0,
  publicRepositories: 8,
  issues: 284,
  pullRequests: 612,
  totalCommits: 3452,
  totalPullRequestContributions: 612,
  totalIssueContributions: 284,
  totalRepositoryContributions: 45,
};

// ---------------------------------------------------------------------------
// isocalendar — IsocalendarData
// ---------------------------------------------------------------------------

export const isocalendar = {
  weeks: calendarWeeks(52),
  totalContributions: 867,
};

// ---------------------------------------------------------------------------
// languages — LanguagesData
// ---------------------------------------------------------------------------

export const languages = {
  total: [
    { name: "TypeScript", colour: "#3178c6", size: 2_450_000 },
    { name: "JavaScript", colour: "#f1e05a", size: 1_832_000 },
    { name: "Python", colour: "#3572A5", size: 1_240_000 },
    { name: "Rust", colour: "#dea584", size: 890_000 },
    { name: "Go", colour: "#00ADD8", size: 720_000 },
    { name: "HTML", colour: "#e34c26", size: 580_000 },
    { name: "CSS", colour: "#663399", size: 340_000 },
    { name: "Shell", colour: "#89e051", size: 120_000 },
  ],
  totalBytes: 8_172_000,
  otherBytes: 0,
};

// ---------------------------------------------------------------------------
// habits — HabitsData
// ---------------------------------------------------------------------------

export const habits = {
  totalCommits: 867,
  days: Array.from({ length: 14 }, (_, i) => {
    const d = new Date("2026-05-13");
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toISOString().split("T")[0],
      count: Math.round(Math.random() * 12),
    };
  }),
  busiestDay: "Tuesday",
  busiestDayCount: 28,
  avgPerDay: 5.2,
  streak: 14,
  hourly: Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: [
      0, 0, 0, 0, 0, 1, 3, 8, 14, 18, 22, 20, 24, 26, 28, 25, 22, 18, 15, 12, 8,
      5, 3, 1,
    ][h],
  })),
  weekdays: [
    { day: "Sunday", count: 42 },
    { day: "Monday", count: 38 },
    { day: "Tuesday", count: 45 },
    { day: "Wednesday", count: 52 },
    { day: "Thursday", count: 48 },
    { day: "Friday", count: 12 },
    { day: "Saturday", count: 8 },
  ],
  facts: [
    { label: "Most productive day", value: "Tuesday" },
    { label: "Most productive hour", value: "2 PM" },
    { label: "Commit streak", value: "14 days" },
  ],
};

// ---------------------------------------------------------------------------
// achievements — AchievementsData
// ---------------------------------------------------------------------------

export const achievements = {
  stats: {
    followers: 24_600,
    following: 0,
    publicRepos: 8,
    gists: 3,
    issues: 284,
    pullRequests: 612,
    totalCommits: 3452,
    starred: 834,
    watching: 42,
  },
  achievements: [
    {
      id: "autobiographer",
      title: "Autobiographer",
      description: "Profile is complete",
      icon: "📝",
      tier: "A" as const,
    },
    {
      id: "collaborator",
      title: "Collaborator",
      description: "Has pull requests in other repos",
      icon: "🤝",
      tier: "A" as const,
    },
    {
      id: "pull-shark",
      title: "Pull Shark",
      description: "Opened 100+ pull requests",
      icon: "🦈",
      tier: "X" as const,
    },
    {
      id: "yolo",
      title: "YOLO",
      description: "Commits directly to main",
      icon: "🕶️",
      tier: "B" as const,
    },
    {
      id: "starstruck",
      title: "Starstruck",
      description: "Has 500+ stars",
      icon: "⭐",
      tier: "A" as const,
    },
    {
      id: "galaxy-brain",
      title: "Galaxy Brain",
      description: "Thought leader",
      icon: "🧠",
      tier: "B" as const,
    },
    {
      id: "public-sponsor",
      title: "Public Sponsor",
      description: "Sponsored open source",
      icon: "💖",
      tier: "C" as const,
    },
    {
      id: "infomaniac",
      title: "Infomaniac",
      description: "Repository list is exhaustive",
      icon: "📖",
      tier: "S" as const,
    },
  ],
};

// ---------------------------------------------------------------------------
// lines — LinesData
// ---------------------------------------------------------------------------

export const lines = {
  repos: [
    {
      name: "metrics",
      totalBytes: 514_000,
      isPrivate: false,
      languages: [
        { name: "TypeScript", bytes: 512_704, colour: "#3178c6" },
        { name: "JavaScript", bytes: 1_296, colour: "#f1e05a" },
      ],
    },
    {
      name: "Hello-World",
      totalBytes: 8_960,
      isPrivate: false,
      languages: [{ name: "JavaScript", bytes: 8_960, colour: "#f1e05a" }],
    },
    {
      name: "linguist",
      totalBytes: 2_140_000,
      isPrivate: false,
      languages: [
        { name: "Ruby", bytes: 1_980_000, colour: "#701516" },
        { name: "C", bytes: 160_000, colour: "#555555" },
      ],
    },
    {
      name: "octokit.rb",
      totalBytes: 437_000,
      isPrivate: false,
      languages: [{ name: "Ruby", bytes: 437_000, colour: "#701516" }],
    },
  ],
  totalBytes: 3_099_960,
};

// ---------------------------------------------------------------------------
// repositories — RepositoriesData
// ---------------------------------------------------------------------------

export const repositories = {
  list: [
    {
      nameWithOwner: "octocat/metrics",
      description: "📊 Generate GitHub metrics as pure SVG",
      isFork: false,
      isPrivate: false,
      stargazerCount: 42,
      forkCount: 8,
      issues: { totalCount: 8 },
      pullRequests: { totalCount: 3 },
      primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      licenseInfo: { spdxId: "MIT", name: "MIT License" },
      createdAt: "2024-01-15T10:00:00Z",
      sorting: "pinned" as const,
    },
    {
      nameWithOwner: "octocat/Hello-World",
      description: "Example repository for demonstrations",
      isFork: false,
      isPrivate: false,
      stargazerCount: 2451,
      forkCount: 1402,
      issues: { totalCount: 142 },
      pullRequests: { totalCount: 67 },
      primaryLanguage: { name: "JavaScript", color: "#f1e05a" },
      licenseInfo: null,
      createdAt: "2011-01-26T19:01:12Z",
      sorting: "pinned" as const,
    },
  ],
};

// ---------------------------------------------------------------------------
// activity — ActivityData
// ---------------------------------------------------------------------------

export const activity = {
  events: [
    {
      type: "PushEvent" as const,
      repo: "octocat/metrics",
      timestamp: new Date("2026-05-13T09:30:00Z"),
      description: "Pushed 3 commits to main",
    },
    {
      type: "PullRequestEvent" as const,
      repo: "octocat/linguist",
      timestamp: new Date("2026-05-13T08:15:00Z"),
      description: "Opened pull request #6724",
    },
    {
      type: "IssuesEvent" as const,
      repo: "octocat/Hello-World",
      timestamp: new Date("2026-05-12T22:00:00Z"),
      description: "Closed issue #1423",
    },
    {
      type: "WatchEvent" as const,
      repo: "vercel/next.js",
      timestamp: new Date("2026-05-12T18:30:00Z"),
      description: "Starred vercel/next.js",
    },
    {
      type: "PushEvent" as const,
      repo: "octocat/metrics",
      timestamp: new Date("2026-05-12T14:00:00Z"),
      description: "Pushed 1 commit to main",
    },
  ],
  timestamps: true,
};

// ---------------------------------------------------------------------------
// stars — StarsData
// ---------------------------------------------------------------------------

export const stars = {
  repositories: [
    {
      nameWithOwner: "vercel/next.js",
      description: "The React framework",
      stargazerCount: 132_000,
      forkCount: 28_400,
      primaryLanguage: { name: "JavaScript", color: "#f1e05a" },
      starredAt: "2026-05-12T18:30:00Z",
    },
    {
      nameWithOwner: "denoland/deno",
      description: "A modern runtime for JavaScript and TypeScript",
      stargazerCount: 98_600,
      forkCount: 5_400,
      primaryLanguage: { name: "Rust", color: "#dea584" },
      starredAt: "2026-05-10T12:00:00Z",
    },
    {
      nameWithOwner: "oven-sh/bun",
      description: "Incredibly fast JavaScript runtime",
      stargazerCount: 74_200,
      forkCount: 2_900,
      primaryLanguage: { name: "Zig", color: "#ec915c" },
      starredAt: "2026-05-08T09:00:00Z",
    },
    {
      nameWithOwner: "astral-sh/uv",
      description: "An extremely fast Python package manager",
      stargazerCount: 52_100,
      forkCount: 1_800,
      primaryLanguage: { name: "Rust", color: "#dea584" },
      starredAt: "2026-05-05T16:00:00Z",
    },
  ],
};

// ---------------------------------------------------------------------------
// followup — FollowupData
// ---------------------------------------------------------------------------

export const followup = {
  sections: [
    {
      title: "octocat/metrics",
      issues: { open: 8, closed: 24 },
      pullRequests: { open: 3, merged: 12, closed: 1 },
    },
    {
      title: "octocat/Hello-World",
      issues: { open: 2, closed: 142 },
      pullRequests: { open: 1, merged: 67, closed: 5 },
    },
    {
      title: "User",
      issues: { open: 15, closed: 269 },
      pullRequests: { open: 6, merged: 606, closed: 23 },
    },
  ],
};

// ---------------------------------------------------------------------------
// stargazers — StargazersData
// ---------------------------------------------------------------------------

export const stargazers = {
  repos: [
    { name: "Hello-World", stars: 2451, isPrivate: false },
    { name: "linguist", stars: 12_463, isPrivate: false },
    { name: "octokit.rb", stars: 2341, isPrivate: false },
    { name: "git-consortium", stars: 84, isPrivate: false },
    { name: "metrics", stars: 42, isPrivate: false },
    { name: "test-repo1", stars: 5, isPrivate: false },
  ],
  totalStars: 17_386,
};

// ---------------------------------------------------------------------------
// people — PeopleData
// ---------------------------------------------------------------------------

export const people = {
  sections: [
    {
      type: "followers" as const,
      totalCount: 24,
      people: Array.from({ length: 24 }, (_, i) => ({
        login: `follower-${String(i + 1)}`,
        avatarUrl: avatar(`follower-${String(i + 1)}`),
      })),
    },
    {
      type: "following" as const,
      totalCount: 12,
      people: Array.from({ length: 12 }, (_, i) => ({
        login: `followed-${String(i + 1)}`,
        avatarUrl: avatar(`followed-${String(i + 1)}`),
      })),
    },
  ],
};

// ---------------------------------------------------------------------------
// gists — GistsData
// ---------------------------------------------------------------------------

export const gists = {
  totalCount: 3,
  stargazers: 12,
  forks: 4,
  files: 7,
  comments: 8,
};

// ---------------------------------------------------------------------------
// discussions — DiscussionsData
// ---------------------------------------------------------------------------

export const discussions = {
  totalCount: 342,
  categories: [
    { name: "General", discussionCount: 156 },
    { name: "Ideas", discussionCount: 87 },
    { name: "Q&A", discussionCount: 64 },
    { name: "Show and Tell", discussionCount: 35 },
  ],
};

// ---------------------------------------------------------------------------
// notable — NotableData
// ---------------------------------------------------------------------------

export const notable = {
  contributions: [
    {
      name: "GitHub",
      avatarUrl: avatar("github"),
      url: "https://github.com/github",
    },
    {
      name: "Vercel",
      avatarUrl: avatar("vercel"),
      url: "https://github.com/vercel",
    },
    {
      name: "Deno Land",
      avatarUrl: avatar("denoland"),
      url: "https://github.com/denoland",
    },
    {
      name: "Microsoft",
      avatarUrl: avatar("microsoft"),
      url: "https://github.com/microsoft",
    },
    {
      name: "Bun",
      avatarUrl: avatar("oven-sh"),
      url: "https://github.com/oven-sh",
    },
  ],
};

// ---------------------------------------------------------------------------
// calendar — CalendarData
// ---------------------------------------------------------------------------

export const calendar = {
  years: [
    {
      year: 2026,
      contributionDays: calendarWeeks(20).flatMap((w) =>
        w.contributionDays.map((d) => ({
          date: d.date,
          contributionCount: d.count,
          colour: d.colour,
        })),
      ),
    },
  ],
};

// ---------------------------------------------------------------------------
// introduction — IntroductionData
// ---------------------------------------------------------------------------

export const introduction = {
  name: "Octocat",
  login: "octocat",
  avatarUrl: avatar("octocat"),
  bio: "GitHub's mascot and demo user. I love open source, collaboration, and code review 🐙",
  company: "@github",
  location: "San Francisco, CA",
  twitter: "octocat",
  website: "https://github.blog",
  joinedAt: "2011-01-25T18:44:36Z",
};

// ---------------------------------------------------------------------------
// reactions — ReactionsData
// ---------------------------------------------------------------------------

export const reactions = {
  totals: {
    "👍": 156,
    "❤️": 42,
    "🚀": 23,
    "👀": 18,
    "😂": 7,
    "🎉": 12,
    "😕": 2,
    "👎": 0,
  },
  items: [
    {
      repository: "octocat/metrics",
      type: "PullRequest",
      title: "Add GraphQL schema validation",
      reactions: {
        total_count: 12,
        "+1": 5,
        "-1": 0,
        laugh: 1,
        hooray: 2,
        confused: 0,
        heart: 3,
        rocket: 1,
        eyes: 0,
      },
    },
    {
      repository: "octocat/linguist",
      type: "Issue",
      title: "Support for new language detection",
      reactions: {
        total_count: 8,
        "+1": 3,
        "-1": 0,
        laugh: 0,
        hooray: 1,
        confused: 0,
        heart: 2,
        rocket: 2,
        eyes: 0,
      },
    },
    {
      repository: "octocat/Hello-World",
      type: "PullRequest",
      title: "Fix README formatting",
      reactions: {
        total_count: 5,
        "+1": 2,
        "-1": 0,
        laugh: 0,
        hooray: 0,
        confused: 0,
        heart: 1,
        rocket: 0,
        eyes: 2,
      },
    },
  ],
  scanned: 86,
};

// ---------------------------------------------------------------------------
// contributors — ContributorsData
// ---------------------------------------------------------------------------

export const contributors = {
  repos: [
    {
      repository: "octocat/metrics",
      isPrivate: false,
      contributors: Array.from({ length: 6 }, (_, i) => ({
        login: `contributor-${String(i + 1)}`,
        avatarUrl: avatar(`contributor-${String(i + 1)}`),
        contributions: 50 - i * 5,
      })),
    },
    {
      repository: "octocat/linguist",
      isPrivate: false,
      contributors: Array.from({ length: 4 }, (_, i) => ({
        login: `dev-${String(i + 1)}`,
        avatarUrl: avatar(`dev-${String(i + 1)}`),
        contributions: 200 - i * 25,
      })),
    },
  ],
};

// ---------------------------------------------------------------------------
// code — CodeData
// ---------------------------------------------------------------------------

export const code = {
  snippet: {
    repository: "octocat/metrics",
    file: "src/pipeline.ts",
    code: [
      "export async function runPipeline(",
      "  config: RootConfig,",
      "  token: string,",
      "): Promise<PipelineResult> {",
      "  const api = createClient(token);",
      "  console.log(`Metrics: loaded config`);",
      "  return result;",
      "}",
    ].join("\n"),
    language: "TypeScript",
    message: "feat: add mock data support for demo preset",
  },
};

// ---------------------------------------------------------------------------
// topics — TopicsData
// ---------------------------------------------------------------------------

export const topics = {
  topics: [
    { name: "typescript", count: 24 },
    { name: "javascript", count: 18 },
    { name: "python", count: 12 },
    { name: "rust", count: 8 },
    { name: "react", count: 14 },
    { name: "nodejs", count: 10 },
    { name: "graphql", count: 7 },
    { name: "api", count: 9 },
    { name: "cli", count: 6 },
    { name: "testing", count: 5 },
    { name: "devtools", count: 4 },
    { name: "automation", count: 8 },
    { name: "docker", count: 3 },
    { name: "open-source", count: 11 },
    { name: "github", count: 16 },
  ],
};

// ---------------------------------------------------------------------------
// licenses — LicencesData
// ---------------------------------------------------------------------------

export const licenses = {
  licences: [
    { spdxId: "MIT", name: "MIT License", count: 24 },
    { spdxId: "Apache-2.0", name: "Apache License 2.0", count: 8 },
    { spdxId: "GPL-3.0", name: "GNU General Public License v3.0", count: 5 },
    { spdxId: "BSD-3-Clause", name: "BSD 3-Clause License", count: 3 },
    { spdxId: "ISC", name: "ISC License", count: 2 },
    { spdxId: "MPL-2.0", name: "Mozilla Public License 2.0", count: 1 },
  ],
  totalRepos: 45,
  unlicensed: 2,
};

// ---------------------------------------------------------------------------
// loc — LocData
// ---------------------------------------------------------------------------

export const loc = {
  repos: [
    {
      name: "octocat/metrics",
      totalLines: 48_354,
      isPrivate: false,
      languages: [
        { name: "TypeScript", lines: 48_230, colour: "#3178c6" },
        { name: "JavaScript", lines: 124, colour: "#f1e05a" },
      ],
    },
    {
      name: "octocat/Hello-World",
      totalLines: 842,
      isPrivate: false,
      languages: [{ name: "JavaScript", lines: 842, colour: "#f1e05a" }],
    },
    {
      name: "octocat/linguist",
      totalLines: 132_500,
      isPrivate: false,
      languages: [
        { name: "Ruby", lines: 124_300, colour: "#701516" },
        { name: "C", lines: 8_200, colour: "#555555" },
      ],
    },
    {
      name: "octocat/octokit.rb",
      totalLines: 42_800,
      isPrivate: false,
      languages: [{ name: "Ruby", lines: 42_800, colour: "#701516" }],
    },
  ],
  totalLines: 224_496,
};

// ---------------------------------------------------------------------------
// projects — ProjectsData
// ---------------------------------------------------------------------------

export const projects = {
  totalProjects: 4,
  projects: [
    {
      title: "Metrics v2",
      description: "Next-generation SVG metrics with plugin system",
      itemCount: 24,
    },
    {
      title: "Documentation",
      description: "User guides and API reference",
      itemCount: 18,
    },
    {
      title: "Performance",
      description: "Optimise generation speed and memory usage",
      itemCount: 7,
    },
    {
      title: "Community",
      description: "Plugin ecosystem and contributor onboarding",
      itemCount: 12,
    },
  ],
};

// ---------------------------------------------------------------------------
// sponsors — SponsorsData
// ---------------------------------------------------------------------------

export const sponsors = {
  about:
    "Support open source development and help maintain metrics for everyone!",
  goal: {
    percentComplete: 67,
    title: "Monthly hosting costs",
    description: "Cover server costs for GitHub Pages and CDN",
  },
  sponsors: Array.from({ length: 8 }, (_, i) => ({
    login: `sponsor-${String(i + 1)}`,
    avatarUrl: avatar(`sponsor-${String(i + 1)}`),
    amount: i === 0 ? 25 : i < 3 ? 10 : null,
    isPrivate: i >= 5,
  })),
  totalCount: 8,
};

// ---------------------------------------------------------------------------
// sponsorships — SponsorshipsData
// ---------------------------------------------------------------------------

export const sponsorships = {
  sponsorships: [
    { login: "vercel", avatarUrl: avatar("vercel"), amount: 10 },
    { login: "denoland", avatarUrl: avatar("denoland"), amount: 5 },
    { login: "oven-sh", avatarUrl: avatar("oven-sh"), amount: 10 },
    { login: "astral-sh", avatarUrl: avatar("astral-sh"), amount: 5 },
    { login: "railwayapp", avatarUrl: avatar("railwayapp"), amount: 10 },
  ],
  totalAmount: 40,
  totalCount: 5,
};

// ---------------------------------------------------------------------------
// traffic — TrafficData
// ---------------------------------------------------------------------------

export const traffic = {
  repos: [
    {
      name: "octocat/Hello-World",
      views: 8420,
      uniques: 4210,
      isPrivate: false,
    },
    { name: "octocat/linguist", views: 6230, uniques: 3115, isPrivate: false },
    { name: "octocat/metrics", views: 4510, uniques: 2255, isPrivate: false },
    {
      name: "octocat/octokit.rb",
      views: 2340,
      uniques: 1170,
      isPrivate: false,
    },
  ],
  totalViews: 21_500,
  totalUniques: 10_750,
};

// ---------------------------------------------------------------------------
// skyline — IsocalendarData (reuses isocalendar shape)
// ---------------------------------------------------------------------------

export const skyline = {
  weeks: calendarWeeks(52),
  totalContributions: 867,
};

// ---------------------------------------------------------------------------
// rss — RssData
// ---------------------------------------------------------------------------

export const rss = {
  feedTitle: "The GitHub Blog",
  feedLink: "https://github.blog",
  items: [
    {
      title: "GitHub Copilot now available for all developers",
      link: "https://github.blog/example-1",
      date: new Date("2026-05-13T08:00:00Z"),
    },
    {
      title: "Introducing GitHub Actions reusable workflows",
      link: "https://github.blog/example-2",
      date: new Date("2026-05-12T14:30:00Z"),
    },
    {
      title: "How we built the new code search",
      link: "https://github.blog/example-3",
      date: new Date("2026-05-11T10:00:00Z"),
    },
    {
      title: "Securing your supply chain with dependabot",
      link: "https://github.blog/example-4",
      date: new Date("2026-05-10T16:45:00Z"),
    },
  ],
};
