/**
 * Languages plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchLanguages, type LanguagesData } from "./source.ts";
import { renderLanguages } from "./render.ts";

const LanguagesPluginConfig = Zod.object({
  limit: Zod.int().min(1).max(20).default(8),
  threshold: Zod.number().min(0).max(100).default(5),
  categories: Zod.array(Zod.enum(["markup", "programming"])).default([
    "markup",
    "programming",
  ]),
  recent_days: Zod.int().min(1).default(14),
  recent_load: Zod.int().min(1).default(300),
});

export const languagesPlugin: Plugin<
  Zod.infer<typeof LanguagesPluginConfig>,
  LanguagesData
> = {
  id: "languages",
  source: {
    id: "languages",
    configSchema: LanguagesPluginConfig,
    async fetch(ctx, config) {
      return await fetchLanguages(ctx.api, ctx.user, {
        limit: config.recent_load,
      });
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLanguages(data, config, ctx);
    },
  },
};
