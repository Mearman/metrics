/**
 * Notable plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchNotable, type NotableData, NotableConfig } from "./source.ts";
import { renderNotable } from "./render.ts";

export const notablePlugin: Plugin<
  z.infer<typeof NotableConfig>,
  NotableData
> = {
  id: "notable",
  source: {
    id: "notable",
    configSchema: NotableConfig,
    async fetch(ctx, config) {
      return await fetchNotable(ctx, config);
    },
    isEmpty(data) {
      return data.contributions.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderNotable(data, config, ctx);
    },
  },
};
