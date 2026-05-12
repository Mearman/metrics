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
  days: z.int().min(1).max(365).default(14),
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

export interface HabitsData {
  totalCommits: number;
  days: DayActivity[];
  busiestDay: string;
  busiestDayCount: number;
  avgPerDay: number;
  streak: number;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

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

  return {
    totalCommits,
    days: dayList,
    busiestDay,
    busiestDayCount,
    avgPerDay,
    streak,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const habitsSource: DataSource<HabitsConfig, HabitsData> = {
  id: "habits",
  configSchema: HabitsConfig,
  async fetch(ctx, config) {
    return await fetchHabits(ctx.api, ctx.user, config.days);
  },
};
