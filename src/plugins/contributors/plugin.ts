/**
 * Contributors plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  fetchContributors,
  ContributorsConfig,
  type ContributorsConfig as ContributorsConfigType,
  type ContributorsData,
} from "./source.ts";
import { renderContributors } from "./render.ts";

export const contributorsPlugin: Plugin<
  ContributorsConfigType,
  ContributorsData
> = {
  id: "contributors",
  source: {
    id: "contributors",
    configSchema: ContributorsConfig,
    async fetch(ctx, config) {
      return await fetchContributors(ctx.api, ctx.user, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderContributors(data, config, ctx);
    },
  },
};
