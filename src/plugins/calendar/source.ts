/**
 * Calendar plugin — data source.
 *
 * Fetches yearly commit activity per year.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
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
// GraphQL query
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
// Fetch
// ---------------------------------------------------------------------------

interface ContributionYearsResult {
  user: {
    contributionsCollection: {
      contributionYears: number[];
    };
  };
}

interface YearResult {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: {
          contributionDays: {
            date: string;
            contributionCount: number;
            color: string;
          }[];
        }[];
      };
    };
  };
}

export async function fetchCalendar(
  ctx: FetchContext,
  config: CalendarConfig,
): Promise<CalendarData> {
  // Get available years
  const yearsResult = await ctx.api.graphql<ContributionYearsResult>(QUERY, {
    login: ctx.user,
  });

  const availableYears =
    yearsResult.user.contributionsCollection.contributionYears.slice(
      0,
      config.years,
    );

  const years: YearActivity[] = [];

  for (const year of availableYears) {
    const from = `${String(year)}-01-01T00:00:00Z`;
    const to = `${String(year)}-12-31T23:59:59Z`;

    const result = await ctx.api.graphql<YearResult>(YEAR_QUERY, {
      login: ctx.user,
      from,
      to,
    });

    const days =
      result.user.contributionsCollection.contributionCalendar.weeks.flatMap(
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
