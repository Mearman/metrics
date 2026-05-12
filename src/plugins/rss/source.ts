/**
 * RSS plugin — data source.
 *
 * Fetches and parses an external RSS/Atom feed.
 * No GitHub API access needed — works with any token.
 *
 * XML parsing uses fast-xml-parser which returns `any`. The ESLint
 * overrides for this file disable unsafe-* rules because every
 * property access on the parsed XML is inherently dynamic.
 */

import * as z from "zod";
import { XMLParser } from "fast-xml-parser";
import type { DataSource } from "../types.ts";
import { getString } from "../../util/props.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const RssConfig = z.object({
  /** RSS/Atom feed URL. Required. */
  source: z.string().trim().min(1),
  /** Maximum number of items to display. 0 = unlimited. */
  limit: z.int().min(0).max(30).default(4),
});
export type RssConfig = z.infer<typeof RssConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface RssItem {
  title: string;
  link: string;
  date: Date;
}

export interface RssData {
  feedTitle: string;
  feedLink: string;
  items: RssItem[];
}

// ---------------------------------------------------------------------------
// XML parsing
// ---------------------------------------------------------------------------

const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (name) => name === "item" || name === "entry" || name === "link",
});

/** Safely extract a string from a parsed XML value. */
function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && value !== null) {
    // fast-xml-parser wraps text in { "#text": "..." }
    const text = getString(value, "#text");
    if (text !== undefined) return text;
  }
  return "";
}

/** Get the href from a link element. */
function getHref(link: unknown): string {
  if (typeof link === "string") return link;
  if (typeof link === "object" && link !== null) {
    const href = getString(link, "@_href");
    if (href !== undefined) return href;
    const text = getString(link, "#text");
    if (text !== undefined) return text;
  }
  return "";
}

/** Find the "alternate" link in an Atom link array. */
function findAlternateLink(links: unknown): string {
  if (!Array.isArray(links)) return getHref(links);
  for (const link of links) {
    if (typeof link === "object" && link !== null) {
      const rel = getString(link, "@_rel");
      if (rel === "alternate") return getHref(link);
    }
  }
  if (links.length > 0) return getHref(links[0]);
  return "";
}

/**
 * Parse an RSS 2.0 or Atom feed from raw XML.
 */
// eslint-disable-next-line consistent-type-assertions
function parseFeed(xml: string): {
  title: string;
  link: string;
  items: RssItem[];
} {
  // fast-xml-parser returns a deeply nested any; we validate structure
  // through safe property access in str() and findAlternateLink().
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsed = parser.parse(xml) as Record<string, unknown>;

  // Atom feed: root is <feed>
  const feed = parsed.feed as Record<string, unknown> | undefined;
  if (feed !== undefined) {
    const title = str(feed.title);
    const link = findAlternateLink(feed.link);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const entries = (feed.entry ?? []) as unknown[];
    const items: RssItem[] = [];
    for (const entry of entries) {
      const e = entry as Record<string, unknown>;
      const dateStr = str(e.published) || str(e.updated);
      items.push({
        title: str(e.title),
        link: findAlternateLink(e.link),
        date: new Date(dateStr),
      });
    }
    return { title, link, items };
  }

  // RSS 2.0: root is <rss><channel>
  const rssRoot = parsed.rss as Record<string, unknown> | undefined;
  const channel = rssRoot?.channel as Record<string, unknown> | undefined;
  if (channel !== undefined) {
    const title = str(channel.title);
    const link = str(channel.link);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rawItems = (channel.item ?? []) as unknown[];
    const items: RssItem[] = [];
    for (const item of rawItems) {
      const i = item as Record<string, unknown>;
      items.push({
        title: str(i.title),
        link: str(i.link),
        date: new Date(str(i.pubDate)),
      });
    }
    return { title, link, items };
  }

  throw new Error("Unrecognised feed format — expected RSS 2.0 or Atom");
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchRss(
  source: string,
  limit: number,
): Promise<RssData> {
  const response = await fetch(source, {
    headers: {
      "User-Agent": "metrics-rss-plugin/1.0",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`RSS feed returned HTTP ${String(response.status)}`);
  }

  const xml = await response.text();
  const parsed = parseFeed(xml);

  // Sort by date (newest first)
  parsed.items.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Apply limit
  if (limit > 0) {
    parsed.items = parsed.items.slice(0, limit);
  }

  return {
    feedTitle: parsed.title,
    feedLink: parsed.link,
    items: parsed.items,
  };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const rssSource: DataSource<RssConfig, RssData> = {
  id: "rss",
  configSchema: RssConfig,
  async fetch(_ctx, config) {
    return await fetchRss(config.source, config.limit);
  },
};
