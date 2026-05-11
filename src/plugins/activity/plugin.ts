/**
 * Activity plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchActivity, type ActivityData, ActivityConfig } from "./source.ts";
import { renderActivity } from "./render.ts";

export const activityPlugin: Plugin<
  Zod.infer<typeof ActivityConfig>,
  ActivityData
> = {
  id: "activity",
  source: {
    id: "activity",
    configSchema: ActivityConfig,
    async fetch(ctx, config) {
      return await fetchActivity(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderActivity(data, config, ctx);
    },
  },
};
