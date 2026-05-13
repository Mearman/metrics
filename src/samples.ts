/**
 * Sample generation — produces mock-data SVGs for every plugin and preset.
 *
 * When the root config has `samples: true` (or a `samples` object),
 * this module generates additional outputs alongside the configured ones:
 *
 * - One SVG per registered plugin, rendered with mock data and sensible defaults
 * - Preset combination SVGs (dashboard, compact, social, etc.)
 *
 * These are written to a `samples/` directory under the output root.
 * The gallery page includes them in a separate "Samples" section.
 */

import * as z from "zod";
import { listPlugins } from "./plugins/registry.ts";
import type { RootConfig } from "./config/schema.ts";

// ---------------------------------------------------------------------------
// Config schema
// ---------------------------------------------------------------------------

export const SamplesConfig = z.union([
  z.boolean(),
  z.object({
    /** Directory to write sample SVGs (relative to cwd). Default: "output/samples" */
    path: z.string().trim().default("output/samples"),
    /** Include per-plugin sample SVGs. Default: true */
    plugins: z.boolean().default(true),
    /** Include preset combination sample SVGs. Default: true */
    presets: z.boolean().default(true),
  }),
]);

export type SamplesConfig = z.infer<typeof SamplesConfig>;

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

interface PresetDef {
  /** Filename stem (without directory or extension) */
  name: string;
  /** Human-readable label for the gallery */
  label: string;
  /** Template name override */
  template?: string;
  /** Plugin configs — keyed by plugin ID */
  plugins: Record<string, Record<string, unknown>>;
}

const PRESETS: PresetDef[] = [
  {
    name: "dashboard",
    label: "Full dashboard",
    plugins: {
      base: {
        sections: [
          "header",
          "activity",
          "community",
          "repositories",
          "metadata",
        ],
        indepth: true,
      },
      introduction: {},
      isocalendar: { duration: "full-year" },
      languages: { limit: 8, threshold: 1, details: ["percentage"] },
      habits: { days: 14, from: 200, charts: true, facts: true },
      achievements: { display: "detailed", secrets: true, threshold: "C" },
      lines: { limit: 4 },
      repositories: { pinned: 4, starred: 2 },
      activity: { limit: 5, days: 14 },
      stars: { limit: 4 },
      followup: { sections: ["repositories", "user"] },
      stargazers: { limit: 6 },
      people: { limit: 14, types: ["followers", "following"] },
      topics: { limit: 15 },
      licenses: { limit: 8 },
    },
  },
  {
    name: "compact",
    label: "Compact profile",
    template: "light",
    plugins: {
      base: { sections: ["header"] },
      languages: { limit: 5, details: ["percentage"] },
      isocalendar: { duration: "half-year" },
    },
  },
  {
    name: "contributions",
    label: "Contribution landscape",
    plugins: {
      isocalendar: { duration: "full-year" },
      calendar: { years: 3 },
      habits: { days: 14, charts: true, facts: true },
    },
  },
  {
    name: "code-languages",
    label: "Code & languages",
    plugins: {
      languages: { limit: 10, threshold: 1, details: ["percentage"] },
      lines: { limit: 4 },
      licenses: { limit: 8 },
      topics: { limit: 20 },
    },
  },
  {
    name: "social",
    label: "Social graph",
    plugins: {
      people: { limit: 24, types: ["followers", "following"] },
      stargazers: { limit: 6 },
      contributors: { limit: 4, contributors_per_repo: 6 },
      sponsors: { sections: ["goal", "list"] },
      sponsorships: { limit: 20 },
    },
  },
  {
    name: "activity-feed",
    label: "Activity feed",
    plugins: {
      activity: { limit: 10, days: 14, timestamps: true },
      reactions: { limit: 10, days: 30 },
      discussions: { categories: true },
      notable: { from: 5 },
    },
  },
  {
    name: "demo",
    label: "All plugins (demo)",
    plugins: {
      base: {},
      isocalendar: { duration: "full-year" },
      languages: { limit: 8 },
      habits: { charts: true, facts: true },
      achievements: { display: "detailed" },
      lines: { limit: 4 },
      repositories: { pinned: 2 },
      activity: { limit: 5 },
      stars: { limit: 4 },
      followup: { sections: ["repositories", "user"] },
      stargazers: { limit: 6 },
      people: { limit: 14, types: ["followers", "following"] },
      gists: {},
      discussions: { categories: true },
      notable: { from: 5 },
      calendar: { years: 1 },
      introduction: {},
      reactions: { limit: 10 },
      contributors: { limit: 4, contributors_per_repo: 6 },
      code: {},
      topics: { limit: 15 },
      licenses: { limit: 8 },
      loc: { limit: 4 },
      projects: { limit: 4 },
      sponsors: { sections: ["goal", "list"] },
      sponsorships: { limit: 20 },
      traffic: { limit: 4 },
      skyline: { max_height: 100 },
      rss: { source: "https://github.blog/feed/", limit: 4 },
    },
  },
];

// ---------------------------------------------------------------------------
// Default plugin configs — sensible mock-data defaults per plugin
// ---------------------------------------------------------------------------

const DEFAULT_PLUGIN_CONFIGS: Record<string, Record<string, unknown>> = {
  base: {
    sections: ["header", "activity", "community", "repositories", "metadata"],
    indepth: true,
  },
  isocalendar: { duration: "full-year" },
  languages: { limit: 8, threshold: 1, details: ["percentage"] },
  habits: { days: 14, from: 200, charts: true, facts: true },
  achievements: { display: "detailed", secrets: true, threshold: "C" },
  lines: { limit: 4 },
  repositories: { pinned: 4, starred: 2 },
  activity: { limit: 5, days: 14 },
  stars: { limit: 4 },
  followup: { sections: ["repositories", "user"] },
  stargazers: { limit: 6, days: 14 },
  people: { limit: 14, types: ["followers", "following"] },
  gists: {},
  discussions: { categories: true },
  notable: { from: 5 },
  calendar: { years: 3 },
  introduction: {},
  reactions: { limit: 10, days: 30 },
  contributors: { limit: 4, contributors_per_repo: 6 },
  code: {},
  topics: { limit: 15 },
  licenses: { limit: 8 },
  loc: { limit: 4 },
  projects: { limit: 4, descriptions: true },
  sponsors: { sections: ["goal", "list"] },
  sponsorships: { limit: 20 },
  traffic: { limit: 4 },
  skyline: { max_height: 100 },
  rss: { source: "https://github.blog/feed/", limit: 4 },
};

// ---------------------------------------------------------------------------
// Output generation — produce OutputConfig entries for sample SVGs
// ---------------------------------------------------------------------------

/** Resolved samples config. */
export interface ResolvedSamplesConfig {
  enabled: boolean;
  path: string;
  plugins: boolean;
  presets: boolean;
}

/** Resolve the raw samples config into a typed object. */
export function resolveSamplesConfig(raw: unknown): ResolvedSamplesConfig {
  if (raw === undefined || raw === false) {
    return {
      enabled: false,
      path: "output/samples",
      plugins: true,
      presets: true,
    };
  }
  if (raw === true) {
    return {
      enabled: true,
      path: "output/samples",
      plugins: true,
      presets: true,
    };
  }
  const parsed = SamplesConfig.parse(raw);
  if (typeof parsed === "boolean") {
    return {
      enabled: parsed,
      path: "output/samples",
      plugins: true,
      presets: true,
    };
  }
  return { enabled: true, ...parsed };
}

/**
 * Generate additional output configs for all sample SVGs.
 *
 * Each output uses `mock` to populate with mock data and sensible defaults.
 * These are appended to the pipeline's normal outputs.
 */
export function generateSampleOutputs(
  samplesConfig: ResolvedSamplesConfig,
  rootConfig: RootConfig,
): {
  path: string;
  label: string;
  group: "plugin-sample" | "preset-sample";
  output: RootConfig["outputs"][number];
}[] {
  const results: {
    path: string;
    label: string;
    group: "plugin-sample" | "preset-sample";
    output: RootConfig["outputs"][number];
  }[] = [];

  const allPluginIds = listPlugins();

  // Per-plugin samples
  if (samplesConfig.plugins) {
    for (const pluginId of allPluginIds) {
      const pluginConfig = DEFAULT_PLUGIN_CONFIGS[pluginId] ?? {};
      results.push({
        path: `${samplesConfig.path}/plugins/${pluginId}.svg`,
        label: pluginId.charAt(0).toUpperCase() + pluginId.slice(1),
        group: "plugin-sample",
        output: {
          path: `${samplesConfig.path}/plugins/${pluginId}.svg`,
          format: "svg",
          order: [],
          template: rootConfig.template,
          mock: [pluginId],
          mock_data: {},
          plugins: { [pluginId]: pluginConfig },
        },
      });
    }
  }

  // Preset samples
  if (samplesConfig.presets) {
    for (const preset of PRESETS) {
      const mockList = Object.keys(preset.plugins);
      results.push({
        path: `${samplesConfig.path}/presets/${preset.name}.svg`,
        label: preset.label,
        group: "preset-sample",
        output: {
          path: `${samplesConfig.path}/presets/${preset.name}.svg`,
          format: "svg",
          order: [],
          template: preset.template ?? rootConfig.template,
          mock: mockList,
          mock_data: {},
          plugins: preset.plugins,
        },
      });
    }
  }

  return results;
}
