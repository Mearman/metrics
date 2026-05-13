/**
 * Languages plugin — composes source and renderer.
 */

import type { Plugin } from "../types.ts";
import {
  fetchLanguages,
  LanguagesConfig,
  type LanguagesData,
} from "./source.ts";
import { renderLanguages } from "./render.ts";

export const languagesPlugin: Plugin<LanguagesConfig, LanguagesData> = {
  id: "languages",
  source: {
    id: "languages",
    configSchema: LanguagesConfig,
    // Fetch is config-independent — limit/threshold/ignored/other/colors/aliases/details are render-only.
    fetchKey: () => ({}),
    async fetch(ctx) {
      return await fetchLanguages(ctx.api, ctx.user, ctx.repos);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLanguages(data, config, ctx);
    },
  },
};
