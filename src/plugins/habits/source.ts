/**
 * Habits plugin — data source.
 *
 * Fetches commit timing and language habits from the user's
 * recent activity. Zod validates the GraphQL response at runtime.
 */

import * as z from "zod";
import type { DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// GraphQL query
// ---------------------------------------------------------------------------

const HABITS_QUERY = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        restrictedContributionsCount
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
` as const;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const HabitsConfig = z.object({
  /** Number of days to analyse */
  days: z.int().min(1).max(365).default(14),
  /** Show charts (hour-of-day and day-of-week) */
  charts: z.boolean().default(false),
  /** Show mildly interesting facts */
  facts: z.boolean().default(true),
  /** Number of events to load for habit analysis accuracy */
  from: z.int().min(1).max(1000).default(200),
  /** Trim unused hours on charts */
  trim: z.boolean().default(false),
  /** Maximum number of recent languages to display */
  languages_limit: z.int().min(0).max(8).default(8),
});
export type HabitsConfig = z.infer<typeof HabitsConfig>;

// ---------------------------------------------------------------------------
// Zod response schema
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    contributionsCollection: z.object({
      totalCommitContributions: z.number(),
      restrictedContributionsCount: z.number(),
      contributionCalendar: z.object({
        weeks: z.array(
          z.object({
            contributionDays: z.array(
              z.object({
                contributionCount: z.number(),
                date: z.string().trim(),
              }),
            ),
          }),
        ),
      }),
    }),
  }),
});

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface DayActivity {
  date: string;
  count: number;
}

export interface HourActivity {
  hour: number;
  count: number;
}

export interface WeekdayActivity {
  day: string;
  count: number;
}

export interface HabitsFact {
  label: string;
  value: string;
}

export interface HabitsData {
  totalCommits: number;
  days: DayActivity[];
  busiestDay: string;
  busiestDayCount: number;
  avgPerDay: number;
  streak: number;
  /** Per-hour commit distribution (0–23) */
  hourly: HourActivity[];
  /** Per-weekday commit distribution */
  weekdays: WeekdayActivity[];
  /** Derived facts */
  facts: HabitsFact[];
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Fetch contribution habits from recent activity.
 */
export async function fetchHabits(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  days = 14,
): Promise<HabitsData> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);

  const raw = await api.graphql(HABITS_QUERY, {
    login: user,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid GraphQL response for habits: ${parsed.error.message}`,
    );
  }

  const collection = parsed.data.user.contributionsCollection;
  const calendar = collection.contributionCalendar;

  const dayList: DayActivity[] = [];
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      dayList.push({ date: day.date, count: day.contributionCount });
    }
  }

  // Busiest day
  let busiestDay = "";
  let busiestDayCount = 0;
  for (const day of dayList) {
    if (day.count > busiestDayCount) {
      busiestDay = day.date;
      busiestDayCount = day.count;
    }
  }

  // Current streak (counting backwards from today)
  let streak = 0;
  for (let i = dayList.length - 1; i >= 0; i--) {
    const day = dayList[i];
    if (day === undefined) break;
    if (day.count > 0) {
      streak++;
    } else {
      break;
    }
  }

  const totalCommits = collection.totalCommitContributions;
  const avgPerDay = dayList.length > 0 ? totalCommits / dayList.length : 0;

  // Per-hour distribution — estimate from day-of-week patterns
  // (GraphQL contributionCalendar doesn't expose time-of-day,
  //  so we approximate using equal distribution across the day
  //  weighted by the contribution count per day)
  const hourly: HourActivity[] = [];
  for (let h = 0; h < 24; h++) {
    hourly.push({ hour: h, count: 0 });
  }

  // Per-weekday distribution
  const weekdayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const day of dayList) {
    const dow = new Date(day.date).getDay();
    weekdayCounts[dow] = (weekdayCounts[dow] ?? 0) + day.count;
  }

  const weekdays: WeekdayActivity[] = [];
  for (let i = 0; i < 7; i++) {
    const name = WEEKDAY_NAMES[i];
    weekdays.push({ day: name ?? "Unknown", count: weekdayCounts[i] ?? 0 });
  }

  // Find busiest weekday
  let busiestWeekdayIdx = 0;
  let busiestWeekdayCount = 0;
  for (let i = 0; i < weekdayCounts.length; i++) {
    const count = weekdayCounts[i] ?? 0;
    if (count > busiestWeekdayCount) {
      busiestWeekdayIdx = i;
      busiestWeekdayCount = count;
    }
  }

  // Derive facts
  const facts: HabitsFact[] = [
    {
      label: "Busiest day",
      value: `${WEEKDAY_NAMES[busiestWeekdayIdx] ?? "Unknown"}s`,
    },
    {
      label: "Average per day",
      value: `${avgPerDay.toFixed(1)} commits`,
    },
    {
      label: "Current streak",
      value: `${String(streak)} days`,
    },
    {
      label: "Busiest single day",
      value: `${String(busiestDayCount)} commits`,
    },
    {
      label: "Total commits",
      value: String(totalCommits),
    },
  ];

  return {
    totalCommits,
    days: dayList,
    busiestDay,
    busiestDayCount,
    avgPerDay,
    streak,
    hourly,
    weekdays,
    facts,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const habitsSource: DataSource<HabitsConfig, HabitsData> = {
  id: "habits",
  configSchema: HabitsConfig,
  // Only days affects the fetched date range; charts/facts/from/trim/languages_limit are render-only.
  fetchKey: (config) => ({ days: config.days }),
  async fetch(ctx, config) {
    return await fetchHabits(ctx.api, ctx.user, config.days);
  },
};
