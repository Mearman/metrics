/**
 * People plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchPeople, type PeopleData, PeopleConfig } from "./source.ts";
import { renderPeople } from "./render.ts";

export const peoplePlugin: Plugin<
  Zod.infer<typeof PeopleConfig>,
  PeopleData
> = {
  id: "people",
  source: {
    id: "people",
    configSchema: PeopleConfig,
    async fetch(ctx, config) {
      return await fetchPeople(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderPeople(data, config, ctx);
    },
  },
};
