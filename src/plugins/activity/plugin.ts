/**
 * Activity plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchActivity, type ActivityData, ActivityConfig } from "./source.ts";
import { renderActivity } from "./render.ts";

export const activityPlugin: Plugin<
  z.infer<typeof ActivityConfig>,
  ActivityData
> = {
  id: "activity",
  source: {
    id: "activity",
    configSchema: ActivityConfig,
    async fetch(ctx, config) {
      return await fetchActivity(ctx, config);
    },
    isEmpty(data) {
      return data.events.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderActivity(data, config, ctx);
    },
  },
};
