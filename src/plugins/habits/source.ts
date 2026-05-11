/**
 * Habits plugin — data source.
 *
 * Fetches commit timing and language habits from the user's
 * recent activity.
 */

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

interface GraphQLResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      restrictedContributionsCount: number;
      contributionCalendar: {
        weeks: {
          contributionDays: {
            contributionCount: number;
            date: string;
          }[];
        }[];
      };
    };
  };
}

/**
 * Fetch contribution habits from recent activity.
 */
export async function fetchHabits(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
  days = 14,
): Promise<HabitsData> {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);

  const data: GraphQLResponse = await api.graphql<GraphQLResponse>(
    HABITS_QUERY,
    {
      login: user,
      from: from.toISOString(),
      to: to.toISOString(),
    },
  );

  const collection = data.user.contributionsCollection;
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
