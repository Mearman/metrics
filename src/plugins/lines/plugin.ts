/**
 * Lines plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchLines, type LinesData } from "./source.ts";
import { renderLines } from "./render.ts";

const LinesPluginConfig = z.object({
  sections: z.array(z.enum(["base", "history"])).default(["base"]),
  repositories_limit: z.int().min(1).default(4),
  history_limit: z.int().min(1).default(1),
});

export const linesPlugin: Plugin<
  z.infer<typeof LinesPluginConfig>,
  LinesData
> = {
  id: "lines",
  source: {
    id: "lines",
    configSchema: LinesPluginConfig,
    async fetch(ctx, config) {
      return await fetchLines(
        ctx.api,
        ctx.user,
        config.repositories_limit,
        ctx.repos,
      );
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLines(data, config, ctx);
    },
  },
};
