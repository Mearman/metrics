/**
 * Languages plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchLanguages, type LanguagesData } from "./source.ts";
import { renderLanguages } from "./render.ts";

const LanguagesPluginConfig = z.object({
  limit: z.int().min(1).max(20).default(8),
  threshold: z.number().min(0).max(100).default(5),
  categories: z
    .array(z.enum(["markup", "programming"]))
    .default(["markup", "programming"]),
  recent_days: z.int().min(1).default(14),
  recent_load: z.int().min(1).default(300),
});

export const languagesPlugin: Plugin<
  z.infer<typeof LanguagesPluginConfig>,
  LanguagesData
> = {
  id: "languages",
  source: {
    id: "languages",
    configSchema: LanguagesPluginConfig,
    async fetch(ctx, config) {
      return await fetchLanguages(ctx.api, ctx.user, ctx.repos, {
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
