/**
 * Topics plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  TopicsConfig,
  type TopicsConfig as TopicsConfigType,
  type TopicsData,
  fetchTopics,
} from "./source.ts";
import { renderTopics } from "./render.ts";

export const topicsPlugin: Plugin<TopicsConfigType, TopicsData> = {
  id: "topics",
  source: {
    id: "topics",
    configSchema: TopicsConfig,
    async fetch(ctx, config) {
      return await fetchTopics(ctx.api, ctx.user, config.limit);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderTopics(data, config, ctx);
    },
  },
};
