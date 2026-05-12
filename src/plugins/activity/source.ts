/**
 * Activity plugin — data source.
 *
 * Fetches recent GitHub activity events via the REST API.
 * Uses the public events endpoint which works with github.token.
 *
 * The Octokit REST API response types for events don't carry typed
 * payloads. We use a Zod schema to parse each event type's payload
 * at runtime, giving us full type safety without assertions.
 */

import * as z from "zod";
import type { FetchContext, DataSource } from "../types.ts";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const ActivityConfig = z.object({
  limit: z.int().min(1).max(100).default(5),
  load: z.int().min(100).max(1000).default(300),
  days: z.int().min(0).max(365).default(14),
  filter: z
    .array(
      z.enum([
        "all",
        "push",
        "issue",
        "pr",
        "review",
        "comment",
        "release",
        "fork",
        "star",
        "wiki",
        "ref/create",
        "ref/delete",
      ]),
    )
    .default(["all"]),
  timestamps: z.boolean().default(false),
  ignored: z.array(z.string().trim()).default([]),
});

export type ActivityConfig = z.infer<typeof ActivityConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export type ActivityEventType =
  | "push"
  | "issue"
  | "pr"
  | "review"
  | "comment"
  | "release"
  | "fork"
  | "star"
  | "wiki"
  | "ref/create"
  | "ref/delete";

export interface ActivityEvent {
  type: ActivityEventType;
  repo: string;
  timestamp: Date;
  description: string;
}

export interface ActivityData {
  events: ActivityEvent[];
  timestamps: boolean;
}

// ---------------------------------------------------------------------------
// Payload schemas — validate each event type's payload with Zod
// ---------------------------------------------------------------------------

const PushPayload = z
  .object({
    ref: z.string().trim().default("refs/heads/main"),
    size: z.number().default(1),
  })
  .loose();

const IssuePayload = z
  .object({
    action: z.string().trim(),
    issue: z.object({ number: z.number(), title: z.string().trim() }),
  })
  .loose();

const PRPayload = z
  .object({
    action: z.string().trim(),
    pull_request: z.object({
      number: z.number(),
      title: z.string().trim(),
      merged: z.boolean().default(false),
    }),
  })
  .loose();

const CommentPayload = z
  .object({
    issue: z.object({ number: z.number() }).optional(),
    pull_request: z.object({ number: z.number() }).optional(),
  })
  .loose();

const ReleasePayload = z
  .object({
    release: z.object({
      name: z.string().trim().nullable(),
      tag_name: z.string().trim(),
    }),
  })
  .loose();

const ForkPayload = z
  .object({
    forkee: z.object({ full_name: z.string().trim() }),
  })
  .loose();

const RefPayload = z
  .object({
    ref: z.string().trim(),
    ref_type: z.string().trim(),
  })
  .loose();

const PagesPayload = z
  .object({
    pages: z.array(z.unknown()).optional(),
  })
  .loose();

// ---------------------------------------------------------------------------
// REST event schema — validates the full event response
// ---------------------------------------------------------------------------

/** Schema for a single REST event from listPublicEventsForUser. */
const RestEventSchema = z.object({
  type: z.string().trim(),
  created_at: z.string().trim().optional(),
  repo: z.object({ name: z.string().trim() }),
  payload: z.unknown(),
});

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchActivity(
  ctx: FetchContext,
  config: ActivityConfig,
): Promise<ActivityData> {
  const maxAge =
    config.days > 0
      ? new Date(Date.now() - config.days * 24 * 60 * 60 * 1000)
      : undefined;

  const pages = Math.ceil(config.load / 100);
  const allEvents: ActivityEvent[] = [];

  for (let page = 1; page <= pages; page++) {
    const response = await ctx.api.rest.activity.listPublicEventsForUser({
      username: ctx.user,
      per_page: 100,
      page,
    });

    // Validate each event through Zod — reject malformed responses
    let hitMaxAge = false;
    for (const raw of response.data) {
      const parsed = RestEventSchema.safeParse(raw);
      if (!parsed.success) continue;
      const event = parsed.data;

      const createdAt =
        event.created_at !== undefined ? new Date(event.created_at) : undefined;

      if (
        maxAge !== undefined &&
        createdAt !== undefined &&
        createdAt < maxAge
      ) {
        hitMaxAge = true;
        break;
      }

      const activity = parseEvent(event.type, event.repo.name, event.payload);
      if (activity === undefined) continue;

      allEvents.push(activity);
    }

    if (hitMaxAge || response.data.length < 100) break;
  }

  const filterSet = new Set(config.filter);
  const ignoredSet = new Set([...ctx.usersIgnored, ...config.ignored]);
  const filtered = allEvents
    .filter((e) => filterSet.has("all") || filterSet.has(e.type))
    .filter((e) => !ignoredSet.has(e.repo.split("/")[0] ?? ""))
    .slice(0, config.limit);

  return { events: filtered, timestamps: config.timestamps };
}

// ---------------------------------------------------------------------------
// Event parsing
// ---------------------------------------------------------------------------

function parseEvent(
  type: string,
  repo: string,
  payload: unknown,
): ActivityEvent | undefined {
  const timestamp = new Date();

  switch (type) {
    case "PushEvent": {
      const p = PushPayload.safeParse(payload);
      if (!p.success) return undefined;
      const branch = p.data.ref.replace("refs/heads/", "");
      const count = p.data.size;
      return {
        type: "push",
        repo,
        timestamp,
        description: `Pushed ${count === 1 ? "a commit" : `${String(count)} commits`} to ${branch}`,
      };
    }
    case "IssuesEvent": {
      const p = IssuePayload.safeParse(payload);
      if (!p.success) return undefined;
      if (!["opened", "closed", "reopened"].includes(p.data.action))
        return undefined;
      return {
        type: "issue",
        repo,
        timestamp,
        description: `${capitalise(p.data.action)} issue #${String(p.data.issue.number)}: ${p.data.issue.title}`,
      };
    }
    case "PullRequestEvent": {
      const p = PRPayload.safeParse(payload);
      if (!p.success) return undefined;
      if (!["opened", "closed"].includes(p.data.action)) return undefined;
      const label =
        p.data.action === "closed" && p.data.pull_request.merged
          ? "Merged"
          : capitalise(p.data.action);
      return {
        type: "pr",
        repo,
        timestamp,
        description: `${label} pull request #${String(p.data.pull_request.number)}: ${p.data.pull_request.title}`,
      };
    }
    case "PullRequestReviewEvent": {
      const p = PRPayload.safeParse(payload);
      if (!p.success) return undefined;
      return {
        type: "review",
        repo,
        timestamp,
        description: `Reviewed PR #${String(p.data.pull_request.number)}: ${p.data.pull_request.title}`,
      };
    }
    case "IssueCommentEvent":
    case "CommitCommentEvent":
    case "PullRequestReviewCommentEvent": {
      const p = CommentPayload.safeParse(payload);
      if (!p.success) return undefined;
      const on =
        type === "IssueCommentEvent"
          ? "issue"
          : type === "CommitCommentEvent"
            ? "commit"
            : "PR";
      const number = p.data.issue?.number ?? p.data.pull_request?.number;
      return {
        type: "comment",
        repo,
        timestamp,
        description: `Commented on ${on}${number !== undefined ? ` #${String(number)}` : ""}`,
      };
    }
    case "ReleaseEvent": {
      const p = ReleasePayload.safeParse(payload);
      if (!p.success) return undefined;
      const name = p.data.release.name ?? p.data.release.tag_name;
      return {
        type: "release",
        repo,
        timestamp,
        description: `Released ${name}`,
      };
    }
    case "ForkEvent": {
      const p = ForkPayload.safeParse(payload);
      if (!p.success) return undefined;
      return {
        type: "fork",
        repo,
        timestamp,
        description: `Forked to ${p.data.forkee.full_name}`,
      };
    }
    case "WatchEvent": {
      return {
        type: "star",
        repo,
        timestamp,
        description: "Starred repository",
      };
    }
    case "CreateEvent": {
      const p = RefPayload.safeParse(payload);
      if (!p.success) return undefined;
      return {
        type: "ref/create",
        repo,
        timestamp,
        description: `Created ${p.data.ref_type} ${p.data.ref}`,
      };
    }
    case "DeleteEvent": {
      const p = RefPayload.safeParse(payload);
      if (!p.success) return undefined;
      return {
        type: "ref/delete",
        repo,
        timestamp,
        description: `Deleted ${p.data.ref_type} ${p.data.ref}`,
      };
    }
    case "GollumEvent": {
      const p = PagesPayload.safeParse(payload);
      if (!p.success) return undefined;
      const pages = p.data.pages?.length ?? 1;
      return {
        type: "wiki",
        repo,
        timestamp,
        description: `Updated ${pages === 1 ? "wiki page" : `${String(pages)} wiki pages`}`,
      };
    }
    default:
      return undefined;
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const activitySource: DataSource<ActivityConfig, ActivityData> = {
  id: "activity",
  configSchema: ActivityConfig,
  async fetch(ctx, config) {
    return await fetchActivity(ctx, config);
  },
};
