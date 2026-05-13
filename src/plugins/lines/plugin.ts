/**
 * Lines plugin — composes source and renderer.
 */

import type { Plugin } from "../types.ts";
import { fetchLines, LinesConfig, type LinesData } from "./source.ts";
import { renderLines } from "./render.ts";

export const linesPlugin: Plugin<LinesConfig, LinesData> = {
  id: "lines",
  source: {
    id: "lines",
    configSchema: LinesConfig,
    async fetch(ctx, config) {
      return await fetchLines(ctx.api, ctx.user, config.limit, ctx.repos);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLines(data, config, ctx);
    },
  },
};
