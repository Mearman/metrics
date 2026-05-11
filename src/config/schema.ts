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
import * as Zod from "zod";

// ---------------------------------------------------------------------------
// Plugin config schemas — each plugin defines its own
// ---------------------------------------------------------------------------

const BasePluginConfig = Zod.object({
  sections: Zod.array(
    Zod.enum(["header", "activity", "community", "repositories", "metadata"]),
  ).default(["header", "activity", "community", "repositories", "metadata"]),
  indepth: Zod.boolean().default(false),
});

const IsocalendarPluginConfig = Zod.object({
  duration: Zod.enum(["half-year", "full-year"]).default("full-year"),
});

const LanguagesPluginConfig = Zod.object({
  limit: Zod.int().min(1).max(20).default(8),
  threshold: Zod.number().min(0).max(100).default(5),
  categories: Zod.array(Zod.enum(["markup", "programming"])).default([
    "markup",
    "programming",
  ]),
  recent_days: Zod.int().min(1).default(14),
  recent_load: Zod.int().min(1).default(300),
});

const HabitsPluginConfig = Zod.object({
  days: Zod.int().min(1).default(14),
  from: Zod.int().min(1).default(200),
  charts: Zod.boolean().default(false),
  facts: Zod.boolean().default(false),
});

const AchievementsPluginConfig = Zod.object({
  display: Zod.enum(["compact", "detailed"]).default("detailed"),
  secrets: Zod.boolean().default(false),
  threshold: Zod.enum(["C", "B", "A", "S", "X"]).default("C"),
});

const LinesPluginConfig = Zod.object({
  sections: Zod.array(Zod.enum(["base", "history"])).default(["base"]),
  repositories_limit: Zod.int().min(1).default(4),
  history_limit: Zod.int().min(1).default(1),
});

const RepositoriesPluginConfig = Zod.object({
  pinned: Zod.int().min(0).max(6).default(0),
  featured: Zod.array(Zod.string().trim()).default([]),
  starred: Zod.int().min(0).max(100).default(0),
  order: Zod.array(Zod.enum(["featured", "pinned", "starred"])).default([
    "featured",
    "pinned",
    "starred",
  ]),
});

const ActivityPluginConfig = Zod.object({
  limit: Zod.int().min(1).max(100).default(5),
  load: Zod.int().min(100).max(1000).default(300),
  days: Zod.int().min(0).max(365).default(14),
  filter: Zod.array(
    Zod.enum([
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
  ).default(["all"]),
  timestamps: Zod.boolean().default(false),
});

// Plugin configs are keyed by plugin ID, all optional.
// .loose() allows plugins we haven't defined schemas for yet.
const PluginsConfig = Zod.object({
  base: BasePluginConfig.optional(),
  isocalendar: IsocalendarPluginConfig.optional(),
  languages: LanguagesPluginConfig.optional(),
  habits: HabitsPluginConfig.optional(),
  achievements: AchievementsPluginConfig.optional(),
  lines: LinesPluginConfig.optional(),
  repositories: RepositoriesPluginConfig.optional(),
  activity: ActivityPluginConfig.optional(),
  // TODO: remaining 21 plugin schemas
}).loose();

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const OutputConfig = Zod.object({
  path: Zod.string().trim().min(1),
  format: Zod.enum(["svg", "png"]).default("svg"),
  plugins: PluginsConfig,
});

// ---------------------------------------------------------------------------
// Sync schema (fork upstream sync)
// ---------------------------------------------------------------------------

const SyncConfig = Zod.object({
  upstream: Zod.string().trim().default("Mearman/metrics"),
  branch: Zod.string().trim().default("main"),
  auto_merge: Zod.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Root schema
// ---------------------------------------------------------------------------

export const RootConfig = Zod.object({
  user: Zod.string().trim().optional(),
  timezone: Zod.string().trim().default("UTC"),
  template: Zod.string().trim().default("classic"),
  sync: SyncConfig.optional(),
  outputs: Zod.array(OutputConfig).min(1),
});

export type RootConfig = Zod.infer<typeof RootConfig>;

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
