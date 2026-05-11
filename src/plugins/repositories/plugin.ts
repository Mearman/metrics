/**
 * Repositories plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import {
  fetchRepositories,
  type RepositoriesData,
  RepositoriesConfig,
} from "./source.ts";
import { renderRepositories } from "./render.ts";

export const repositoriesPlugin: Plugin<
  Zod.infer<typeof RepositoriesConfig>,
  RepositoriesData
> = {
  id: "repositories",
  source: {
    id: "repositories",
    configSchema: RepositoriesConfig,
    async fetch(ctx, config) {
      return await fetchRepositories(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderRepositories(data, config, ctx);
    },
  },
};
