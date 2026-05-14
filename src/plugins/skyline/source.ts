/**
 * Skyline plugin — data source.
 *
 * Fetches contribution calendar data for the isometric 3D skyline.
 * Reuses the same GraphQL query and data types as isocalendar,
 * but supports fetching a specific calendar year.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import type { IsocalendarData } from "../isocalendar/source.ts";
import {
  fetchIsocalendar,
  fetchIsocalendarRange,
} from "../isocalendar/source.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const SkylineConfig = z.object({
  /** Year to display. 0 or omitted means current rolling year. */
  year: z.int().min(0).max(2099).default(0),
  /** Maximum building height in pixels */
  max_height: z.int().min(20).max(200).default(100),
  /** Colour scheme: contributions (default), night, monochrome, neon */
  colour_scheme: z
    .enum(["contributions", "monochrome", "neon"])
    .default("contributions"),
});
export type SkylineConfig = z.infer<typeof SkylineConfig>;

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

/**
 * Fetch contribution calendar data for the skyline.
 *
 * If year is 0, uses the rolling 52-week calendar (same as isocalendar).
 * For a specific year (e.g. 2024), fetches Jan 1 – Dec 31 of that year.
 */
export const skylineSource: DataSource<SkylineConfig, IsocalendarData> = {
  id: "skyline",
  configSchema: SkylineConfig,
  async fetch(ctx, config) {
    const year = config.year;
    const currentYear = new Date().getFullYear();

    if (year === 0 || year === currentYear) {
      return await fetchIsocalendar(ctx.api, ctx.user, "full-year");
    }

    const from = new Date(Date.UTC(year, 0, 1));
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
    return await fetchIsocalendarRange(ctx.api, ctx.user, from, to);
  },
};
