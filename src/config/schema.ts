/**
 * Root configuration schema for metrics generation.
 *
 * Single source of truth: Zod schema → inferred type → runtime validation.
 * The schema is the canonical definition of all configuration.
 */

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

// Plugin configs are keyed by plugin ID, all optional
const PluginsConfig = z
  .object({
    base: BasePluginConfig.optional(),
    isocalendar: IsocalendarPluginConfig.optional(),
    languages: LanguagesPluginConfig.optional(),
    habits: HabitsPluginConfig.optional(),
    achievements: AchievementsPluginConfig.optional(),
    lines: LinesPluginConfig.optional(),
    // TODO: remaining 23 plugin schemas
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
  sync: SyncConfig.optional(),
  outputs: z.array(OutputConfig).min(1),
});

export type RootConfig = z.infer<typeof RootConfig>;

// ---------------------------------------------------------------------------
// Loader
// ---------------------------------------------------------------------------

/**
 * Parse and validate a YAML config string.
 *
 * Accepts optional overrides (e.g. user from GITHUB_REPOSITORY_OWNER).
 * Throws ZodError on invalid config — callers should surface this.
 */
export function loadConfig(
  raw: string,
  overrides?: { user?: string },
): RootConfig {
  // YAML is parsed by the `yaml` package — but for the scaffold, JSON.parse
  // works too since YAML is a superset of JSON.
  // TODO: Use `yaml` package for proper YAML parsing
  const parsed: unknown = JSON.parse(raw);
  const config = RootConfig.parse(parsed);

  // Apply overrides — user from GITHUB_REPOSITORY_OWNER in fork mode
  if (overrides?.user && !config.user) {
    return { ...config, user: overrides.user };
  }

  return config;
}
