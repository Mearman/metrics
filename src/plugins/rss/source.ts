/**
 * RSS plugin — data source.
 *
 * Fetches and parses an external RSS/Atom feed.
 * No GitHub API access needed — works with any token.
 *
 * fast-xml-parser returns `any` from `parse()`. We assign to `unknown`
 * and narrow through `in` checks + the props helpers, never `as`.
 */

import * as z from "zod";
import { XMLParser } from "fast-xml-parser";
import type { DataSource } from "../types.ts";
import { getString, getArray } from "../../util/props.ts";

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

/** Extract a text string from a parsed XML node. Handles both plain strings
 *  and fast-xml-parser wrapped nodes like `{ "#text": "value" }`. */
function textOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  const inner = getString(value, "#text");
  return inner ?? "";
}

/** Extract an href URL from a link element (Atom uses `@_href`). */
function hrefOf(link: unknown): string {
  const attr = getString(link, "@_href");
  if (attr !== undefined) return attr;
  const inner = getString(link, "#text");
  if (inner !== undefined) return inner;
  if (typeof link === "string") return link;
  return "";
}

/** Find the "alternate" link in an Atom link array. */
function alternateLink(links: unknown): string {
  if (Array.isArray(links)) {
    for (const link of links) {
      const rel = getString(link, "@_rel");
      if (rel === "alternate") return hrefOf(link);
    }
    if (links.length > 0) return hrefOf(links[0]);
    return "";
  }
  return hrefOf(links);
}

/** Extract items from an Atom `<feed>` root. */
function parseAtom(feed: object): {
  title: string;
  link: string;
  items: RssItem[];
} {
  const title = textOf(getString(feed, "title"));
  const rawLinks = getString(feed, "link") !== undefined ? feed : undefined;
  const link =
    rawLinks !== undefined ? alternateLink(getArray(feed, "link")) : "";

  const entries = getArray(feed, "entry") ?? [];
  const items: RssItem[] = [];
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const dateStr =
      textOf(getString(entry, "published")) ||
      textOf(getString(entry, "updated"));
    items.push({
      title: textOf(getString(entry, "title")),
      link: alternateLink(getArray(entry, "link")),
      date: new Date(dateStr),
    });
  }
  return { title, link, items };
}

/** Extract items from an RSS 2.0 `<rss><channel>` root. */
function parseRss20(channel: object): {
  title: string;
  link: string;
  items: RssItem[];
} {
  const title = textOf(getString(channel, "title"));
  const channelLink = getString(channel, "link");
  const link =
    channelLink !== undefined
      ? textOf(channelLink)
      : alternateLink(getArray(channel, "link"));

  const rawItems = getArray(channel, "item") ?? [];
  const items: RssItem[] = [];
  for (const item of rawItems) {
    if (typeof item !== "object" || item === null) continue;
    const itemLink = getString(item, "link");
    items.push({
      title: textOf(getString(item, "title")),
      link:
        itemLink !== undefined
          ? textOf(itemLink)
          : alternateLink(getArray(item, "link")),
      date: new Date(textOf(getString(item, "pubDate"))),
    });
  }
  return { title, link, items };
}

/**
 * Parse an RSS 2.0 or Atom feed from raw XML.
 *
 * Assigns the `any` return of `parser.parse()` to `unknown`,
 * then narrows through `in` checks — no type assertions.
 */
function parseFeed(xml: string): {
  title: string;
  link: string;
  items: RssItem[];
} {
  const parsed: unknown = parser.parse(xml);

  // Atom feed: root has a "feed" key
  if (typeof parsed === "object" && parsed !== null && "feed" in parsed) {
    const feed = parsed.feed;
    if (typeof feed === "object" && feed !== null) {
      return parseAtom(feed);
    }
  }

  // RSS 2.0: root has an "rss" key containing a "channel"
  if (typeof parsed === "object" && parsed !== null && "rss" in parsed) {
    const rss = parsed.rss;
    if (typeof rss === "object" && rss !== null && "channel" in rss) {
      const channel = rss.channel;
      if (typeof channel === "object" && channel !== null) {
        return parseRss20(channel);
      }
    }
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
