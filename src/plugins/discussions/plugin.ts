/**
 * Discussions plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import {
  fetchDiscussions,
  type DiscussionsData,
  DiscussionsConfig,
} from "./source.ts";
import { renderDiscussions } from "./render.ts";

export const discussionsPlugin: Plugin<
  Zod.infer<typeof DiscussionsConfig>,
  DiscussionsData
> = {
  id: "discussions",
  source: {
    id: "discussions",
    configSchema: DiscussionsConfig,
    async fetch(ctx, config) {
      return await fetchDiscussions(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderDiscussions(data, config, ctx);
    },
  },
};
