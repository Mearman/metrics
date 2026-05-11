/**
 * Isocalendar plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchIsocalendar, type IsocalendarData } from "./source.ts";
import { renderIsocalendar } from "./render.ts";

const IsocalendarPluginConfig = Zod.object({
  duration: Zod.enum(["half-year", "full-year"]).default("full-year"),
});

export const isocalendarPlugin: Plugin<
  Zod.infer<typeof IsocalendarPluginConfig>,
  IsocalendarData
> = {
  id: "isocalendar",
  tokenScope: "user",
  source: {
    id: "isocalendar",
    configSchema: IsocalendarPluginConfig,
    async fetch(ctx, config) {
      return await fetchIsocalendar(ctx.api, ctx.user, config.duration);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderIsocalendar(data, config, ctx);
    },
  },
};
