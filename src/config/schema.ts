/**
 * Root configuration schema for metrics generation.
 *
 * Single source of truth: Zod schema → inferred type → runtime validation.
 * The schema is the canonical definition of all configuration.
 *
 * Each plugin defines its own Zod config schema in its source file.
 * This module imports them all and composes the root config.
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
import { ReposConfigSchema } from "../repos/filter.ts";
import { BasePluginConfig } from "../plugins/base/source.ts";
import { IsocalendarConfig } from "../plugins/isocalendar/source.ts";
import { LanguagesConfig } from "../plugins/languages/source.ts";
import { HabitsConfig } from "../plugins/habits/source.ts";
import { AchievementsPluginConfig } from "../plugins/achievements/plugin.ts";
import { LinesConfig } from "../plugins/lines/source.ts";
import { RepositoriesConfig } from "../plugins/repositories/source.ts";
import { ActivityConfig } from "../plugins/activity/source.ts";
import { StarsConfig } from "../plugins/stars/source.ts";
import { FollowupConfig } from "../plugins/followup/source.ts";
import { StargazersConfig } from "../plugins/stargazers/source.ts";
import { PeopleConfig } from "../plugins/people/source.ts";
import { GistsConfig } from "../plugins/gists/source.ts";
import { DiscussionsConfig } from "../plugins/discussions/source.ts";
import { NotableConfig } from "../plugins/notable/source.ts";
import { CalendarConfig } from "../plugins/calendar/source.ts";
import { CodeConfig } from "../plugins/code/source.ts";
import { IntroductionConfig } from "../plugins/introduction/source.ts";
import { ReactionsConfig } from "../plugins/reactions/source.ts";
import { ContributorsConfig } from "../plugins/contributors/source.ts";
import { ProjectsConfig } from "../plugins/projects/source.ts";
import { SponsorsConfig } from "../plugins/sponsors/source.ts";
import { SponsorshipsConfig } from "../plugins/sponsorships/source.ts";
import { TrafficConfig } from "../plugins/traffic/source.ts";
import { LocConfig } from "../plugins/loc/source.ts";
import { TopicsConfig } from "../plugins/topics/source.ts";
import { LicencesConfig } from "../plugins/licenses/source.ts";
import { SkylineConfig } from "../plugins/skyline/source.ts";
import { RssConfig } from "../plugins/rss/source.ts";

// ---------------------------------------------------------------------------
// Plugin config — composed from each plugin's own schema
// ---------------------------------------------------------------------------

const PluginsConfig = z.object({
  base: BasePluginConfig.optional(),
  isocalendar: IsocalendarConfig.optional(),
  languages: LanguagesConfig.optional(),
  habits: HabitsConfig.optional(),
  achievements: AchievementsPluginConfig.optional(),
  lines: LinesConfig.optional(),
  repositories: RepositoriesConfig.optional(),
  activity: ActivityConfig.optional(),
  stars: StarsConfig.optional(),
  followup: FollowupConfig.optional(),
  stargazers: StargazersConfig.optional(),
  people: PeopleConfig.optional(),
  gists: GistsConfig.optional(),
  discussions: DiscussionsConfig.optional(),
  notable: NotableConfig.optional(),
  calendar: CalendarConfig.optional(),
  code: CodeConfig.optional(),
  introduction: IntroductionConfig.optional(),
  reactions: ReactionsConfig.optional(),
  contributors: ContributorsConfig.optional(),
  projects: ProjectsConfig.optional(),
  sponsors: SponsorsConfig.optional(),
  sponsorships: SponsorshipsConfig.optional(),
  traffic: TrafficConfig.optional(),
  loc: LocConfig.optional(),
  topics: TopicsConfig.optional(),
  licenses: LicencesConfig.optional(),
  skyline: SkylineConfig.optional(),
  rss: RssConfig.optional(),
});

const ColourOverrides = z
  .object({
    text: z.string().trim().optional(),
    textSecondary: z.string().trim().optional(),
    textTertiary: z.string().trim().optional(),
    accent: z.string().trim().optional(),
    background: z.string().trim().optional(),
    border: z.string().trim().optional(),
    error: z.string().trim().optional(),
    warning: z.string().trim().optional(),
    success: z.string().trim().optional(),
    calendar: z
      .object({
        L0: z.string().trim().optional(),
        L1: z.string().trim().optional(),
        L2: z.string().trim().optional(),
        L3: z.string().trim().optional(),
        L4: z.string().trim().optional(),
      })
      .optional(),
  })
  .optional();

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const OutputConfig = z.object({
  path: z.string().trim().min(1),
  format: z.enum(["svg", "png"]).default("svg"),
  /** Explicit plugin rendering order. If set, plugins are rendered in this
   *  order; any plugins not listed are appended in their YAML key order. */
  order: z.array(z.string().trim()).default([]),
  /** Per-output template override (falls back to root template). */
  template: z.string().trim().optional(),
  /** Per-output colour overrides (falls back to root colours). */
  colours: ColourOverrides,
  plugins: PluginsConfig,
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
  /** Repository fetching and filtering rules */
  repos: ReposConfigSchema.default({ fetch: "public", rules: [] }),
  /** Global user ignore list (e.g. bots). Propagated to activity, reactions, contributors. */
  users_ignored: z.array(z.string().trim()).default([]),
  /** Custom colour overrides — merge into the theme's colours */
  colours: ColourOverrides,
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
