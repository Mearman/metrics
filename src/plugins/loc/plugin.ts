/**
 * Lines of Code plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  LocConfig,
  type LocConfig as LocConfigType,
  type LocData,
  fetchLoc,
} from "./source.ts";
import { renderLoc } from "./render.ts";

export const locPlugin: Plugin<LocConfigType, LocData> = {
  id: "loc",
  source: {
    id: "loc",
    configSchema: LocConfig,
    async fetch(ctx, config) {
      return await fetchLoc(
        ctx.api,
        ctx.user,
        config.limit,
        config.repositories,
        ctx.token,
        ctx.repos,
        config.cache_dir,
      );
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLoc(data, config, ctx);
    },
  },
};
