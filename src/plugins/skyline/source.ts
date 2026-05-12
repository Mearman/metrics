/**
 * Skyline plugin — data source.
 *
 * Fetches contribution calendar data for the isometric 3D skyline.
 * Reuses the same GraphQL query and data types as isocalendar,
 * but always fetches a single year.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";
import type { IsocalendarData } from "../isocalendar/source.ts";
import { fetchIsocalendar } from "../isocalendar/source.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const SkylineConfig = z.object({
  /** Year to display. 0 or omitted means current year. */
  year: z.int().min(0).max(2099).default(0),
  /** Maximum building height in pixels */
  max_height: z.int().min(20).max(200).default(100),
});
export type SkylineConfig = z.infer<typeof SkylineConfig>;

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

/**
 * Fetch contribution calendar data for the skyline.
 *
 * If year is 0 or current year, uses the rolling 52-week calendar.
 * For past years, we still use the same endpoint — GitHub's contribution
 * calendar is always available for the authenticated user.
 */
export const skylineSource: DataSource<SkylineConfig, IsocalendarData> = {
  id: "skyline",
  configSchema: SkylineConfig,
  async fetch(ctx) {
    // Always fetch a full year of contribution data
    return await fetchIsocalendar(ctx.api, ctx.user, "full-year");
  },
};
