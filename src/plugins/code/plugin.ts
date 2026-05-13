/**
 * Code plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  fetchCode,
  CodeConfig,
  type CodeConfig as CodeConfigType,
  type CodeData,
} from "./source.ts";
import { renderCode } from "./render.ts";

export const codePlugin: Plugin<CodeConfigType, CodeData> = {
  id: "code",
  source: {
    id: "code",
    configSchema: CodeConfig,
    async fetch(ctx, config) {
      return await fetchCode(ctx.api, ctx.user, config);
    },
    isEmpty(data) {
      return data.snippet === null;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderCode(data, config, ctx);
    },
  },
};
