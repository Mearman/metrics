/**
 * Reactions plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  fetchReactions,
  ReactionsConfig,
  type ReactionsConfig as ReactionsConfigType,
  type ReactionsData,
} from "./source.ts";
import { renderReactions } from "./render.ts";

export const reactionsPlugin: Plugin<ReactionsConfigType, ReactionsData> = {
  id: "reactions",
  source: {
    id: "reactions",
    configSchema: ReactionsConfig,
    async fetch(ctx, config) {
      return await fetchReactions(ctx.api, ctx.user, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderReactions(data, config, ctx);
    },
  },
};
