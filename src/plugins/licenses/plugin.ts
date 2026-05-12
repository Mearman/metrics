/**
 * Licences plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  LicencesConfig,
  type LicencesConfig as LicencesConfigType,
  type LicencesData,
  fetchLicences,
} from "./source.ts";
import { renderLicences } from "./render.ts";

export const licencesPlugin: Plugin<LicencesConfigType, LicencesData> = {
  id: "licenses",
  source: {
    id: "licenses",
    configSchema: LicencesConfig,
    async fetch(ctx, config) {
      return await fetchLicences(ctx.api, ctx.user, config.limit, ctx.repos);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderLicences(data, config, ctx);
    },
  },
};
