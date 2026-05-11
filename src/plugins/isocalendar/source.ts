/**
 * Isocalendar plugin — data source.
 *
 * Fetches contribution calendar data for the contribution heatmap.
 */

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

interface CalendarDay {
  contributionCount: number;
  date: string;
  color: string;
}

interface GraphQLResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: {
          contributionDays: CalendarDay[];
        }[];
        totalContributions: number;
      };
    };
  };
}

/**
 * Fetch contribution calendar data.
 *
 * @param duration - "half-year" (26 weeks) or "full-year" (52 weeks)
 */
export async function fetchIsocalendar(
  api: {
    graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  },
  user: string,
  duration: "half-year" | "full-year" = "full-year",
): Promise<IsocalendarData> {
  const weeks = duration === "half-year" ? 26 : 52;
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - weeks * 7);

  const data: GraphQLResponse = await api.graphql<GraphQLResponse>(
    ISCALENDAR_QUERY,
    {
      login: user,
      from: from.toISOString(),
      to: now.toISOString(),
    },
  );

  const calendar = data.user.contributionsCollection.contributionCalendar;

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
