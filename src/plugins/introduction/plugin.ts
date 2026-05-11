/**
 * Introduction plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  fetchIntroduction,
  IntroductionConfig,
  type IntroductionData,
} from "./source.ts";
import { renderIntroduction } from "./render.ts";

export const introductionPlugin: Plugin<IntroductionConfig, IntroductionData> =
  {
    id: "introduction",
    source: {
      id: "introduction",
      configSchema: IntroductionConfig,
      async fetch(ctx) {
        return await fetchIntroduction(ctx.api, ctx.user);
      },
    },
    renderer: {
      render(data, config, ctx) {
        return renderIntroduction(data, config, ctx);
      },
    },
  };
