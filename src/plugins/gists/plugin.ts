/**
 * Gists plugin — composes source and renderer.
 */

import type { Plugin } from "../types.ts";
import { fetchGists, type GistsData, GistsConfig } from "./source.ts";
import { renderGists } from "./render.ts";

export const gistsPlugin: Plugin<GistsConfig, GistsData> = {
  id: "gists",
  source: {
    id: "gists",
    configSchema: GistsConfig,
    async fetch(ctx, config) {
      return await fetchGists(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderGists(data, config, ctx);
    },
  },
};
