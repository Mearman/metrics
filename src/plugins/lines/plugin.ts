/**
 * Lines plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchLines, type LinesData } from "./source.ts";
import { renderLines } from "./render.ts";

const LinesPluginConfig = Zod.object({
  sections: Zod.array(Zod.enum(["base", "history"])).default(["base"]),
  repositories_limit: Zod.int().min(1).default(4),
  history_limit: Zod.int().min(1).default(1),
});

export const linesPlugin: Plugin<
  Zod.infer<typeof LinesPluginConfig>,
  LinesData
> = {
  id: "lines",
  source: {
    id: "lines",
    configSchema: LinesPluginConfig,
    async fetch(ctx, config) {
      return await fetchLines(ctx.api, ctx.user, config.repositories_limit);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLines(data, config, ctx);
    },
  },
};
