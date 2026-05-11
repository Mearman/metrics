/**
 * Followup plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchFollowup, type FollowupData, FollowupConfig } from "./source.ts";
import { renderFollowup } from "./render.ts";

export const followupPlugin: Plugin<
  Zod.infer<typeof FollowupConfig>,
  FollowupData
> = {
  id: "followup",
  source: {
    id: "followup",
    configSchema: FollowupConfig,
    async fetch(ctx, config) {
      return await fetchFollowup(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderFollowup(data, config, ctx);
    },
  },
};
