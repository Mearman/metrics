/**
 * Calendar plugin — data source.
 *
 * Fetches yearly commit activity per year.
 * Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const CalendarConfig = z.object({
  years: z.int().min(1).max(10).default(3),
});

export type CalendarConfig = z.infer<typeof CalendarConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface YearActivity {
  year: number;
  contributionDays: {
    date: string;
    contributionCount: number;
    colour: string;
  }[];
}

export interface CalendarData {
  years: YearActivity[];
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionYears
    }
  }
}`;

const YEAR_QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

// ---------------------------------------------------------------------------
// Zod response schemas
// ---------------------------------------------------------------------------

const YearsResponseSchema = z.object({
  user: z.object({
    contributionsCollection: z.object({
      contributionYears: z.array(z.number()),
    }),
  }),
});

const YearResponseSchema = z.object({
  user: z.object({
    contributionsCollection: z.object({
      contributionCalendar: z.object({
        weeks: z.array(
          z.object({
            contributionDays: z.array(
              z.object({
                date: z.string().trim(),
                contributionCount: z.number(),
                color: z.string().trim(),
              }),
            ),
          }),
        ),
      }),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchCalendar(
  ctx: FetchContext,
  config: CalendarConfig,
): Promise<CalendarData> {
  // Get available years
  const rawYears = await ctx.api.graphql(QUERY, { login: ctx.user });
  const parsedYears = YearsResponseSchema.safeParse(rawYears);
  if (!parsedYears.success) {
    throw new Error(
      `Invalid GraphQL response for calendar years: ${parsedYears.error.message}`,
    );
  }

  const availableYears =
    parsedYears.data.user.contributionsCollection.contributionYears.slice(
      0,
      config.years,
    );

  const years: YearActivity[] = [];

  for (const year of availableYears) {
    const from = `${String(year)}-01-01T00:00:00Z`;
    const to = `${String(year)}-12-31T23:59:59Z`;

    const rawYear = await ctx.api.graphql(YEAR_QUERY, {
      login: ctx.user,
      from,
      to,
    });
    const parsedYear = YearResponseSchema.safeParse(rawYear);
    if (!parsedYear.success) {
      throw new Error(
        `Invalid GraphQL response for calendar year ${String(year)}: ${parsedYear.error.message}`,
      );
    }

    const days =
      parsedYear.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
        (week) =>
          week.contributionDays.map((day) => ({
            date: day.date,
            contributionCount: day.contributionCount,
            colour: day.color,
          })),
      );

    years.push({ year, contributionDays: days });
  }

  return { years };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const calendarSource: DataSource<CalendarConfig, CalendarData> = {
  id: "calendar",
  configSchema: CalendarConfig,
  async fetch(ctx, config) {
    return await fetchCalendar(ctx, config);
  },
};
