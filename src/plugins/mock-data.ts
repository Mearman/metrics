/**
 * Mock/placeholder data for all plugins.
 *
 * Used when the `mock` config option includes a plugin ID — the pipeline
 * skips the fetch step and uses this data instead. The data is realistic
 * but clearly placeholder (generic names, example repos, etc.).
 *
 * Each plugin's source.ts imports its mock data from here and exposes it
 * via the `mockData` property on the DataSource interface.
 */

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/** Placeholder avatar URL — GitHub's identicon service. */
const avatar = (login: string) =>
  `https://avatars.githubusercontent.com/${login}?s=56`;

// ---------------------------------------------------------------------------
// base
// ---------------------------------------------------------------------------

export const base = {
  login: "octocat",
  name: "Octocat",
  avatarUrl: avatar("octocat"),
  bio: "GitHub's mascot and demo user",
  company: "@github",
  location: "San Francisco, CA",
  website: "https://github.blog",
  twitter: "octocat",
  publicRepos: 8,
  publicGists: 3,
  followers: 24_600,
  following: 0,
  createdAt: "2011-01-25T18:44:36Z",
  totalCommits: 3452,
  totalIssues: 284,
  totalPullRequests: 612,
  totalStars: 834,
  repos: [
    { name: "Hello-World", stars: 2451, forks: 1402, language: "JavaScript" },
    { name: "git-consortium", stars: 84, forks: 142, language: "Ruby" },
    { name: "linguist", stars: 12_463, forks: 4237, language: "Ruby" },
    { name: "octokit.rb", stars: 2341, forks: 786, language: "Ruby" },
    { name: "test-repo1", stars: 5, forks: 0, language: "TypeScript" },
  ],
} as const;

// ---------------------------------------------------------------------------
// isocalendar
// ---------------------------------------------------------------------------

export const isocalendar = generateCalendarData();

function generateCalendarData() {
  const weeks = [];
  const base = new Date("2026-04-14");
  for (let w = 0; w < 52; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(base);
      date.setDate(date.getDate() - (52 - w) * 7 + d);
      const count = Math.max(
        0,
        Math.round(
          Math.sin(w * 0.3 + d) * 3 +
            Math.cos(w * 0.15) * 2 +
            (d >= 1 && d <= 5 ? 2 : -1),
        ),
      );
      days.push({
        contributionCount: count,
        date: date.toISOString().split("T")[0],
        color:
          count === 0
            ? "#161b22"
            : count <= 2
              ? "#0e4429"
              : count <= 5
                ? "#006d32"
                : count <= 8
                  ? "#26a641"
                  : "#39d353",
      });
    }
    weeks.push({ contributionDays: days });
  }
  return { weeks };
}

// ---------------------------------------------------------------------------
// languages
// ---------------------------------------------------------------------------

export const languages = {
  languages: [
    { name: "TypeScript", totalSize: 2_450_000, colour: "#3178c6" },
    { name: "JavaScript", totalSize: 1_832_000, colour: "#f1e05a" },
    { name: "Python", totalSize: 1_240_000, colour: "#3572A5" },
    { name: "Rust", totalSize: 890_000, colour: "#dea584" },
    { name: "Go", totalSize: 720_000, colour: "#00ADD8" },
    { name: "HTML", totalSize: 580_000, colour: "#e34c26" },
    { name: "CSS", totalSize: 340_000, colour: "#663399" },
    { name: "Shell", totalSize: 120_000, colour: "#89e051" },
  ],
  totalSize: 8_172_000,
} as const;

// ---------------------------------------------------------------------------
// habits
// ---------------------------------------------------------------------------

export const habits = {
  hourlyDistribution: [
    0, 0, 0, 0, 0, 1, 3, 8, 14, 18, 22, 20, 24, 26, 28, 25, 22, 18, 15, 12, 8,
    5, 3, 1,
  ],
  dailyDistribution: [42, 38, 45, 52, 48, 12, 8],
  mostActiveDay: "Tuesday",
  mostActiveHour: 14,
  totalCommits: 867,
  recentLanguages: [
    { name: "TypeScript", count: 124 },
    { name: "Python", count: 67 },
    { name: "Rust", count: 43 },
    { name: "Go", count: 31 },
  ],
} as const;

// ---------------------------------------------------------------------------
// achievements
// ---------------------------------------------------------------------------

export const achievements = {
  stats: {
    totalCommits: 3452,
    totalIssues: 284,
    totalPullRequests: 612,
    totalStars: 834,
    totalFollowers: 24600,
    totalForks: 6842,
    totalRepos: 45,
    totalGists: 3,
  },
  achievements: [
    {
      id: "infomaniac",
      title: "Infomaniac",
      desc: "Repository list is exhaustive",
      icon: "📖",
      tier: "S",
      threshold: 0,
    },
    {
      id: "autobiographer",
      title: "Autobiographer",
      desc: "Profile is complete",
      icon: "📝",
      tier: "A",
      threshold: 0,
    },
    {
      id: "collaborator",
      title: "Collaborator",
      desc: "Has pull requests in other repos",
      icon: "🤝",
      tier: "A",
      threshold: 0,
    },
    {
      id: "pull-shark",
      title: "Pull Shark",
      desc: "Opened 100+ pull requests",
      icon: "🦈",
      tier: "X",
      threshold: 100,
    },
    {
      id: "yolo",
      title: "YOLO",
      desc: "Commits directly to main",
      icon: "🕶️",
      tier: "B",
      threshold: 0,
    },
    {
      id: "starstruck",
      title: "Starstruck",
      desc: "Has 500+ stars",
      icon: "⭐",
      tier: "A",
      threshold: 500,
    },
    {
      id: "galaxy-brain",
      title: "Galaxy Brain",
      desc: "Thought leader with insightful answers",
      icon: "🧠",
      tier: "B",
      threshold: 0,
    },
    {
      id: "public-sponsor",
      title: "Public Sponsor",
      desc: "Sponsored open source projects",
      icon: "💖",
      tier: "C",
      threshold: 0,
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// lines
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
} as const;

// ---------------------------------------------------------------------------
// repositories
// ---------------------------------------------------------------------------

export const repositories = {
  pinned: [
    {
      name: "metrics",
      description: "📊 Generate GitHub metrics as pure SVG",
      language: "TypeScript",
      languageColour: "#3178c6",
      stars: 42,
      forks: 8,
    },
    {
      name: "Hello-World",
      description: "Example repository for demonstrations",
      language: "JavaScript",
      languageColour: "#f1e05a",
      stars: 2451,
      forks: 1402,
    },
  ],
  featured: [],
  starred: [],
} as const;

// ---------------------------------------------------------------------------
// activity
// ---------------------------------------------------------------------------

export const activity = {
  events: [
    {
      type: "PushEvent",
      repo: "octocat/metrics",
      createdAt: "2026-05-13T09:30:00Z",
      payload: { ref: "refs/heads/main", size: 3 },
    },
    {
      type: "PullRequestEvent",
      repo: "octocat/linguist",
      createdAt: "2026-05-13T08:15:00Z",
      payload: { action: "opened", number: 6724 },
    },
    {
      type: "IssuesEvent",
      repo: "octocat/Hello-World",
      createdAt: "2026-05-12T22:00:00Z",
      payload: { action: "closed", number: 1423 },
    },
    {
      type: "WatchEvent",
      repo: "vercel/next.js",
      createdAt: "2026-05-12T18:30:00Z",
      payload: {},
    },
    {
      type: "PushEvent",
      repo: "octocat/metrics",
      createdAt: "2026-05-12T14:00:00Z",
      payload: { ref: "refs/heads/main", size: 1 },
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// stars
// ---------------------------------------------------------------------------

export const stars = {
  repositories: [
    {
      name: "vercel/next.js",
      description: "The React framework",
      stars: 132_000,
      language: "JavaScript",
    },
    {
      name: "denoland/deno",
      description: "A modern runtime for JavaScript and TypeScript",
      stars: 98_600,
      language: "Rust",
    },
    {
      name: "oven-sh/bun",
      description:
        "Incredibly fast JavaScript runtime, bundler, test framework",
      stars: 74_200,
      language: "Zig",
    },
    {
      name: "astral-sh/uv",
      description: "An extremely fast Python package manager",
      stars: 52_100,
      language: "Rust",
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// followup
// ---------------------------------------------------------------------------

export const followup = {
  sections: [
    {
      title: "Repositories",
      type: "repositories" as const,
      items: [
        {
          name: "octocat/metrics",
          openIssues: 8,
          openPRs: 3,
          closedIssues: 24,
          mergedPRs: 12,
        },
        {
          name: "octocat/Hello-World",
          openIssues: 2,
          openPRs: 1,
          closedIssues: 142,
          mergedPRs: 67,
        },
      ],
    },
    {
      title: "User",
      type: "user" as const,
      items: [
        { openIssues: 15, openPRs: 6, closedIssues: 269, mergedPRs: 606 },
      ],
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// stargazers
// ---------------------------------------------------------------------------

export const stargazers = {
  repos: [
    { name: "octocat/Hello-World", stars: 2451, recentStars: 23 },
    { name: "octocat/linguist", stars: 12_463, recentStars: 14 },
    { name: "octocat/octokit.rb", stars: 2341, recentStars: 5 },
    { name: "octocat/git-consortium", stars: 84, recentStars: 2 },
    { name: "octocat/metrics", stars: 42, recentStars: 8 },
    { name: "octocat/test-repo1", stars: 5, recentStars: 1 },
  ],
  totalStars: 17_386,
} as const;

// ---------------------------------------------------------------------------
// people
// ---------------------------------------------------------------------------

export const people = {
  sections: [
    {
      type: "followers" as const,
      total: 24_600,
      users: Array.from({ length: 24 }, (_, i) => ({
        login: `follower-${String(i + 1)}`,
        avatarUrl: avatar(`follower-${String(i + 1)}`),
      })),
    },
    {
      type: "following" as const,
      total: 12,
      users: Array.from({ length: 12 }, (_, i) => ({
        login: `followed-${String(i + 1)}`,
        avatarUrl: avatar(`followed-${String(i + 1)}`),
      })),
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// gists
// ---------------------------------------------------------------------------

export const gists = {
  total: 3,
  files: [
    { name: "example.json", language: "JSON", size: 256 },
    { name: "config.yml", language: "YAML", size: 512 },
    { name: "notes.md", language: "Markdown", size: 1024 },
  ],
} as const;

// ---------------------------------------------------------------------------
// discussions
// ---------------------------------------------------------------------------

export const discussions = {
  totalCount: 342,
  categories: [
    { name: "General", count: 156 },
    { name: "Ideas", count: 87 },
    { name: "Q&A", count: 64 },
    { name: "Show and Tell", count: 35 },
  ],
} as const;

// ---------------------------------------------------------------------------
// notable
// ---------------------------------------------------------------------------

export const notable = {
  contributions: [
    {
      organisation: "github",
      login: "github",
      avatarUrl: avatar("github"),
      repos: 12,
    },
    {
      organisation: "vercel",
      login: "vercel",
      avatarUrl: avatar("vercel"),
      repos: 3,
    },
    {
      organisation: "denoland",
      login: "denoland",
      avatarUrl: avatar("denoland"),
      repos: 2,
    },
    {
      organisation: "microsoft",
      login: "microsoft",
      avatarUrl: avatar("microsoft"),
      repos: 5,
    },
    {
      organisation: "oven-sh",
      login: "oven-sh",
      avatarUrl: avatar("oven-sh"),
      repos: 1,
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// calendar
// ---------------------------------------------------------------------------

export const calendar = {
  years: [
    {
      year: 2026,
      total: 2345,
      weeks: generateCalendarData().weeks.slice(0, 20),
    },
    { year: 2025, total: 4812, weeks: generateCalendarData().weeks },
    { year: 2024, total: 3967, weeks: generateCalendarData().weeks },
  ],
} as const;

// ---------------------------------------------------------------------------
// introduction
// ---------------------------------------------------------------------------

export const introduction = {
  login: "octocat",
  name: "Octocat",
  bio: "GitHub's mascot and demo user. I love open source, collaboration, and code review 🐙",
} as const;

// ---------------------------------------------------------------------------
// reactions
// ---------------------------------------------------------------------------

export const reactions = {
  totals: {
    heart: 42,
    "+1": 156,
    rocket: 23,
    eyes: 18,
    laugh: 7,
    hooray: 12,
    "-1": 0,
    confused: 0,
  },
  items: [
    {
      repository: "octocat/metrics",
      type: "PR",
      title: "Add GraphQL schema validation",
      reactions: { total_count: 12 },
    },
    {
      repository: "octocat/linguist",
      type: "Issue",
      title: "Support for new language detection",
      reactions: { total_count: 8 },
    },
    {
      repository: "octocat/Hello-World",
      type: "PR",
      title: "Fix README formatting",
      reactions: { total_count: 5 },
    },
  ],
  scanned: 86,
} as const;

// ---------------------------------------------------------------------------
// contributors
// ---------------------------------------------------------------------------

export const contributors = {
  repos: [
    {
      name: "octocat/metrics",
      contributors: Array.from({ length: 8 }, (_, i) => ({
        login: `contributor-${String(i + 1)}`,
        avatarUrl: avatar(`contributor-${String(i + 1)}`),
        contributions: 50 - i * 5,
      })),
    },
    {
      name: "octocat/linguist",
      contributors: Array.from({ length: 6 }, (_, i) => ({
        login: `dev-${String(i + 1)}`,
        avatarUrl: avatar(`dev-${String(i + 1)}`),
        contributions: 200 - i * 25,
      })),
    },
    {
      name: "octocat/Hello-World",
      contributors: Array.from({ length: 4 }, (_, i) => ({
        login: `coder-${String(i + 1)}`,
        avatarUrl: avatar(`coder-${String(i + 1)}`),
        contributions: 30 - i * 5,
      })),
    },
    {
      name: "octocat/octokit.rb",
      contributors: Array.from({ length: 6 }, (_, i) => ({
        login: `rubyist-${String(i + 1)}`,
        avatarUrl: avatar(`rubyist-${String(i + 1)}`),
        contributions: 80 - i * 12,
      })),
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// code
// ---------------------------------------------------------------------------

export const code = {
  snippet: {
    repo: "octocat/metrics",
    language: "TypeScript",
    filename: "src/pipeline.ts",
    code: [
      "export async function runPipeline(",
      "  config: RootConfig,",
      "  token: string,",
      "): Promise<PipelineResult> {",
      "  const api = createClient(token);",
      '  console.log(`Metrics: loaded config for user "${user}"`);',
      "  const result = await runPipeline(configWithUser, token);",
      "  return result;",
      "}",
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// topics
// ---------------------------------------------------------------------------

export const topics = {
  topics: [
    "typescript",
    "javascript",
    "python",
    "rust",
    "go",
    "react",
    "nodejs",
    "graphql",
    "api",
    "cli",
    "testing",
    "devtools",
    "automation",
    "ci-cd",
    "docker",
    "machine-learning",
    "data-science",
    "web-development",
    "open-source",
    "github",
  ],
} as const;

// ---------------------------------------------------------------------------
// licenses
// ---------------------------------------------------------------------------

export const licenses = {
  licences: [
    { name: "MIT", count: 24 },
    { name: "Apache-2.0", count: 8 },
    { name: "GPL-3.0", count: 5 },
    { name: "BSD-3-Clause", count: 3 },
    { name: "ISC", count: 2 },
    { name: "MPL-2.0", count: 1 },
  ],
  unlicensed: 2,
} as const;

// ---------------------------------------------------------------------------
// loc
// ---------------------------------------------------------------------------

export const loc = {
  repos: [
    {
      name: "metrics",
      languages: { TypeScript: 48_230, JavaScript: 124 },
      total: 48_354,
    },
    { name: "Hello-World", languages: { JavaScript: 842 }, total: 842 },
    {
      name: "linguist",
      languages: { Ruby: 124_300, C: 8_200 },
      total: 132_500,
    },
    { name: "octokit.rb", languages: { Ruby: 42_800 }, total: 42_800 },
  ],
  total: 224_496,
} as const;

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------

export const projects = {
  totalProjects: 4,
  projects: [
    {
      title: "Metrics v2",
      shortDescription: "Next-generation SVG metrics with plugin system",
      items: { totalCount: 24 },
    },
    {
      title: "Documentation",
      shortDescription: "User guides and API reference",
      items: { totalCount: 18 },
    },
    {
      title: "Performance",
      shortDescription: "Optimise generation speed and memory usage",
      items: { totalCount: 7 },
    },
    {
      title: "Community",
      shortDescription: "Plugin ecosystem and contributor onboarding",
      items: { totalCount: 12 },
    },
  ],
} as const;

// ---------------------------------------------------------------------------
// sponsors
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
  })),
  totalCount: 8,
} as const;

// ---------------------------------------------------------------------------
// sponsorships
// ---------------------------------------------------------------------------

export const sponsorships = {
  sponsorships: [
    { login: "vercel", avatarUrl: avatar("vercel"), monthlyPriceInDollars: 10 },
    {
      login: "denoland",
      avatarUrl: avatar("denoland"),
      monthlyPriceInDollars: 5,
    },
    {
      login: "oven-sh",
      avatarUrl: avatar("oven-sh"),
      monthlyPriceInDollars: 10,
    },
    {
      login: "astral-sh",
      avatarUrl: avatar("astral-sh"),
      monthlyPriceInDollars: 5,
    },
    {
      login: "railwayapp",
      avatarUrl: avatar("railwayapp"),
      monthlyPriceInDollars: 10,
    },
  ],
  totalAmount: 40,
  totalCount: 5,
} as const;

// ---------------------------------------------------------------------------
// traffic
// ---------------------------------------------------------------------------

export const traffic = {
  repos: [
    { name: "octocat/Hello-World", views: 8420 },
    { name: "octocat/linguist", views: 6230 },
    { name: "octocat/metrics", views: 4510 },
    { name: "octocat/octokit.rb", views: 2340 },
  ],
} as const;

// ---------------------------------------------------------------------------
// skyline
// ---------------------------------------------------------------------------

export const skyline = generateCalendarData();

// ---------------------------------------------------------------------------
// rss
// ---------------------------------------------------------------------------

export const rss = {
  items: [
    {
      title: "GitHub Copilot now available for all developers",
      link: "https://github.blog/example-1",
      pubDate: "2026-05-13T08:00:00Z",
    },
    {
      title: "Introducing GitHub Actions reusable workflows",
      link: "https://github.blog/example-2",
      pubDate: "2026-05-12T14:30:00Z",
    },
    {
      title: "How we built the new code search",
      link: "https://github.blog/example-3",
      pubDate: "2026-05-11T10:00:00Z",
    },
    {
      title: "Securing your supply chain with dependabot",
      link: "https://github.blog/example-4",
      pubDate: "2026-05-10T16:45:00Z",
    },
  ],
} as const;
