/**
 * Sponsors plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  SponsorsConfig,
  type SponsorsConfig as SponsorsConfigType,
  type SponsorsData,
  fetchSponsors,
} from "./source.ts";
import { renderSponsors } from "./render.ts";

export const sponsorsPlugin: Plugin<SponsorsConfigType, SponsorsData> = {
  id: "sponsors",
  source: {
    id: "sponsors",
    configSchema: SponsorsConfig,
    async fetch(ctx, config) {
      return await fetchSponsors(ctx.api, ctx.user, config.size);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderSponsors(data, config, ctx);
    },
  },
};
