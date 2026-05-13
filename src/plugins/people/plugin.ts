/**
 * People plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchPeople, type PeopleData, PeopleConfig } from "./source.ts";
import { renderPeople } from "./render.ts";

export const peoplePlugin: Plugin<z.infer<typeof PeopleConfig>, PeopleData> = {
  id: "people",
  source: {
    id: "people",
    configSchema: PeopleConfig,
    async fetch(ctx, config) {
      return await fetchPeople(ctx, config);
    },
    isEmpty(data) {
      return data.sections.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderPeople(data, config, ctx);
    },
  },
};
