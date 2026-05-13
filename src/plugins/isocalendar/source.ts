/**
 * Isocalendar plugin — data source.
 *
 * Fetches contribution calendar data for the contribution heatmap.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const ISCALENDAR_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
              color
            }
          }
          totalContributions
        }
      }
    }
  }
` as const;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const IsocalendarConfig = z.object({
  duration: z.enum(["half-year", "full-year"]).default("full-year"),
});
export type IsocalendarConfig = z.infer<typeof IsocalendarConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    contributionsCollection: z.object({
      contributionCalendar: z.object({
        weeks: z.array(
          z.object({
            contributionDays: z.array(
              z.object({
                contributionCount: z.number(),
                date: z.string().trim(),
                color: z.string().trim(),
              }),
            ),
          }),
        ),
        totalContributions: z.number(),
      }),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface ContributionDay {
  date: string;
  count: number;
  colour: string;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface IsocalendarData {
  weeks: ContributionWeek[];
  totalContributions: number;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

/**
 * Fetch contribution calendar data for a rolling duration.
 *
 * @param duration - "half-year" (26 weeks) or "full-year" (52 weeks)
 */
export async function fetchIsocalendar(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  duration: "half-year" | "full-year" = "full-year",
): Promise<IsocalendarData> {
  const weeks = duration === "half-year" ? 26 : 52;
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - weeks * 7);
  return await fetchIsocalendarRange(api, user, from, now);
}

/**
 * Fetch contribution calendar data for an explicit date range.
 *
 * Used by the skyline plugin to fetch specific calendar years.
 */
export async function fetchIsocalendarRange(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  from: Date,
  to: Date,
): Promise<IsocalendarData> {
  const raw = await api.graphql(ISCALENDAR_QUERY, {
    login: user,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for isocalendar: ${parsed.error.message}`,
    );
  }

  const calendar =
    parsed.data.user.contributionsCollection.contributionCalendar;

  return {
    weeks: calendar.weeks.map((week) => ({
      contributionDays: week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        colour: day.color,
      })),
    })),
    totalContributions: calendar.totalContributions,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const isocalendarSource: DataSource<IsocalendarConfig, IsocalendarData> =
  {
    id: "isocalendar",
    configSchema: IsocalendarConfig,
    // Only duration affects the fetched date range.
    fetchKey: (config) => ({ duration: config.duration }),
    async fetch(ctx, config) {
      return await fetchIsocalendar(ctx.api, ctx.user, config.duration);
    },
  };
