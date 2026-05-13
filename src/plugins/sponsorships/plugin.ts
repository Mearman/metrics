/**
 * Sponsorships plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  SponsorshipsConfig,
  type SponsorshipsConfig as SponsorshipsConfigType,
  type SponsorshipsData,
  fetchSponsorships,
} from "./source.ts";
import { renderSponsorships } from "./render.ts";

export const sponsorshipsPlugin: Plugin<
  SponsorshipsConfigType,
  SponsorshipsData
> = {
  id: "sponsorships",
  source: {
    id: "sponsorships",
    configSchema: SponsorshipsConfig,
    async fetch(ctx, config) {
      return await fetchSponsorships(
        ctx.api,
        ctx.user,
        config.size,
        config.limit,
      );
    },
    isEmpty(data) {
      return data.sponsorships.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderSponsorships(data, config, ctx);
    },
  },
};
