/**
 * Discussions plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import {
  fetchDiscussions,
  type DiscussionsData,
  DiscussionsConfig,
} from "./source.ts";
import { renderDiscussions } from "./render.ts";

export const discussionsPlugin: Plugin<
  z.infer<typeof DiscussionsConfig>,
  DiscussionsData
> = {
  id: "discussions",
  source: {
    id: "discussions",
    configSchema: DiscussionsConfig,
    async fetch(ctx, config) {
      return await fetchDiscussions(ctx, config);
    },
    isEmpty(data) {
      return data.totalCount === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderDiscussions(data, config, ctx);
    },
  },
};
