/**
 * Root configuration schema for metrics generation.
 *
 * Single source of truth: Zod schema → inferred type → runtime validation.
 * The schema is the canonical definition of all configuration.
 *
 * Config is loaded via cosmiconfig, which searches for:
 *   - .github/metrics.yml
 *   - .github/metrics.yaml
 *   - .github/metrics.json
 *   - .metricsrc (JSON/YAML)
 *   - .metricsrc.yml / .metricsrc.yaml / .metricsrc.json
 *   - metrics.config.ts / metrics.config.js / metrics.config.mjs
 *   - "metrics" key in package.json
 */

import { cosmiconfig } from "cosmiconfig";
import * as z from "zod";

// ---------------------------------------------------------------------------
// Plugin config schemas — each plugin defines its own
// ---------------------------------------------------------------------------

const BasePluginConfig = z.object({
  sections: z
    .array(
      z.enum(["header", "activity", "community", "repositories", "metadata"]),
    )
    .default(["header", "activity", "community", "repositories", "metadata"]),
  indepth: z.boolean().default(false),
});

const IsocalendarPluginConfig = z.object({
  duration: z.enum(["half-year", "full-year"]).default("full-year"),
});

const LanguagesPluginConfig = z.object({
  limit: z.int().min(1).max(20).default(8),
  threshold: z.number().min(0).max(100).default(5),
  categories: z
    .array(z.enum(["markup", "programming"]))
    .default(["markup", "programming"]),
  recent_days: z.int().min(1).default(14),
  recent_load: z.int().min(1).default(300),
});

const HabitsPluginConfig = z.object({
  days: z.int().min(1).default(14),
  from: z.int().min(1).default(200),
  charts: z.boolean().default(false),
  facts: z.boolean().default(false),
});

const AchievementsPluginConfig = z.object({
  display: z.enum(["compact", "detailed"]).default("detailed"),
  secrets: z.boolean().default(false),
  threshold: z.enum(["C", "B", "A", "S", "X"]).default("C"),
});

const LinesPluginConfig = z.object({
  sections: z.array(z.enum(["base", "history"])).default(["base"]),
  repositories_limit: z.int().min(1).default(4),
  history_limit: z.int().min(1).default(1),
});

const RepositoriesPluginConfig = z.object({
  pinned: z.int().min(0).max(6).default(0),
  featured: z.array(z.string().trim()).default([]),
  starred: z.int().min(0).max(100).default(0),
  order: z
    .array(z.enum(["featured", "pinned", "starred"]))
    .default(["featured", "pinned", "starred"]),
});

const ActivityPluginConfig = z.object({
  limit: z.int().min(1).max(100).default(5),
  load: z.int().min(100).max(1000).default(300),
  days: z.int().min(0).max(365).default(14),
  filter: z
    .array(
      z.enum([
        "all",
        "push",
        "issue",
        "pr",
        "review",
        "comment",
        "release",
        "fork",
        "star",
        "wiki",
        "ref/create",
        "ref/delete",
      ]),
    )
    .default(["all"]),
  timestamps: z.boolean().default(false),
});

// Plugin configs are keyed by plugin ID, all optional.
// .loose() allows plugins we haven't defined schemas for yet.
const PluginsConfig = z
  .object({
    base: BasePluginConfig.optional(),
    isocalendar: IsocalendarPluginConfig.optional(),
    languages: LanguagesPluginConfig.optional(),
    habits: HabitsPluginConfig.optional(),
    achievements: AchievementsPluginConfig.optional(),
    lines: LinesPluginConfig.optional(),
    repositories: RepositoriesPluginConfig.optional(),
    activity: ActivityPluginConfig.optional(),
    stars: z.object({ limit: z.int().min(1).max(100).default(4) }).optional(),
    followup: z
      .object({
        sections: z
          .array(z.enum(["repositories", "user"]))
          .default(["repositories"]),
        indepth: z.boolean().default(false),
      })
      .optional(),
    stargazers: z
      .object({
        limit: z.int().min(1).max(30).default(8),
      })
      .optional(),
    people: z
      .object({
        limit: z.int().min(0).max(100).default(24),
        size: z.int().min(8).max(64).default(28),
        types: z
          .array(z.enum(["followers", "following"]))
          .default(["followers", "following"]),
      })
      .optional(),
    gists: z.object({}).optional(),
    discussions: z
      .object({
        categories: z.boolean().default(true),
        limit: z.int().min(1).max(20).default(5),
      })
      .optional(),
    notable: z
      .object({
        indepth: z.boolean().default(false),
        from: z.int().min(1).default(5),
      })
      .optional(),
    calendar: z
      .object({
        years: z.int().min(1).max(10).default(3),
      })
      .optional(),
    code: z
      .object({
        max_length: z.int().min(20).max(500).default(200),
        scan_limit: z.int().min(1).max(50).default(20),
      })
      .optional(),
    // TODO: remaining 11 plugin schemas
  })
  .loose();

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const OutputConfig = z.object({
  path: z.string().trim().min(1),
  format: z.enum(["svg", "png"]).default("svg"),
  plugins: PluginsConfig,
});

// ---------------------------------------------------------------------------
// Sync schema (fork upstream sync)
// ---------------------------------------------------------------------------

const SyncConfig = z.object({
  upstream: z.string().trim().default("Mearman/metrics"),
  branch: z.string().trim().default("main"),
  auto_merge: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export const RootConfig = z.object({
  user: z.string().trim().optional(),
  timezone: z.string().trim().default("UTC"),
  template: z.string().trim().default("classic"),
  /** Embed font data in SVG for cross-host rendering. Default true. */
  embed_fonts: z.boolean().default(true),
  sync: SyncConfig.optional(),
  outputs: z.array(OutputConfig).min(1),
});

export type RootConfig = z.infer<typeof RootConfig>;

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

const explorer = cosmiconfig("metrics", {
  searchPlaces: [
    ".github/metrics.yml",
    ".github/metrics.yaml",
    ".github/metrics.json",
    ".metricsrc",
    ".metricsrc.yml",
    ".metricsrc.yaml",
    ".metricsrc.json",
    "metrics.config.ts",
    "metrics.config.js",
    "metrics.config.mjs",
  ],
});

/**
 * Search for and load a metrics config file.
 *
 * Uses cosmiconfig to search standard locations. If `configPath` is provided,
 * loads that specific file instead of searching.
 *
 * Accepts optional overrides (e.g. user from GITHUB_REPOSITORY_OWNER).
 * Throws ZodError on invalid config.
 */
export async function loadConfig(
  configPath?: string,
  overrides?: { user?: string },
): Promise<RootConfig> {
  const result =
    configPath !== undefined
      ? await explorer.load(configPath)
      : await explorer.search();

  if (result === null || result.isEmpty) {
    throw new Error(
      "No metrics config found. Create .github/metrics.yml or specify a config path.",
    );
  }

  const config = RootConfig.parse(result.config);

  // Apply overrides — user from GITHUB_REPOSITORY_OWNER in fork mode
  if (overrides?.user && !config.user) {
    return { ...config, user: overrides.user };
  }

  return config;
}
