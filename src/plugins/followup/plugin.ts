/**
 * Followup plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchFollowup, type FollowupData, FollowupConfig } from "./source.ts";
import { renderFollowup } from "./render.ts";

export const followupPlugin: Plugin<
  z.infer<typeof FollowupConfig>,
  FollowupData
> = {
  id: "followup",
  source: {
    id: "followup",
    configSchema: FollowupConfig,
    async fetch(ctx, config) {
      return await fetchFollowup(ctx, config);
    },
    isEmpty(data) {
      return data.sections.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderFollowup(data, config, ctx);
    },
  },
};
