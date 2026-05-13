/**
 * Repositories plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import {
  fetchRepositories,
  type RepositoriesData,
  RepositoriesConfig,
} from "./source.ts";
import { renderRepositories } from "./render.ts";

export const repositoriesPlugin: Plugin<
  z.infer<typeof RepositoriesConfig>,
  RepositoriesData
> = {
  id: "repositories",
  source: {
    id: "repositories",
    configSchema: RepositoriesConfig,
    async fetch(ctx, config) {
      return await fetchRepositories(ctx, config);
    },
    isEmpty(data) {
      return data.list.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderRepositories(data, config, ctx);
    },
  },
};
