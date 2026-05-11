/**
 * Stargazers plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import {
  fetchStargazers,
  type StargazersData,
  StargazersConfig,
} from "./source.ts";
import { renderStargazers } from "./render.ts";

export const stargazersPlugin: Plugin<
  Zod.infer<typeof StargazersConfig>,
  StargazersData
> = {
  id: "stargazers",
  source: {
    id: "stargazers",
    configSchema: StargazersConfig,
    async fetch(ctx, config) {
      return await fetchStargazers(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderStargazers(data, config, ctx);
    },
  },
};
