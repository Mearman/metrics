/**
 * RSS plugin — composes source and renderer.
 *
 * Displays items from an external RSS or Atom feed.
 * No GitHub token needed — the source config provides the feed URL.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import type { RssData } from "./source.ts";
import { rssSource, RssConfig } from "./source.ts";
import { renderRss } from "./render.ts";

export const rssPlugin: Plugin<z.infer<typeof RssConfig>, RssData> = {
  id: "rss",
  source: rssSource,
  renderer: {
    render(data, config, ctx) {
      return renderRss(data, config, ctx);
    },
  },
};
