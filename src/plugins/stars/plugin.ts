/**
 * Stars plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchStars, type StarsData, StarsConfig } from "./source.ts";
import { renderStars } from "./render.ts";

export const starsPlugin: Plugin<z.infer<typeof StarsConfig>, StarsData> = {
  id: "stars",
  source: {
    id: "stars",
    configSchema: StarsConfig,
    async fetch(ctx, config) {
      return await fetchStars(ctx, config);
    },
    isEmpty(data) {
      return data.repositories.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderStars(data, config, ctx);
    },
  },
};
