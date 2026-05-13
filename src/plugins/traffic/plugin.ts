/**
 * Traffic plugin — registration.
 */

import type { Plugin } from "../types.ts";
import {
  TrafficConfig,
  type TrafficConfig as TrafficConfigType,
  type TrafficData,
  fetchTraffic,
} from "./source.ts";
import { renderTraffic } from "./render.ts";

export const trafficPlugin: Plugin<TrafficConfigType, TrafficData> = {
  id: "traffic",
  source: {
    id: "traffic",
    configSchema: TrafficConfig,
    async fetch(ctx, config) {
      return await fetchTraffic(ctx.api, ctx.user, config.limit, ctx.repos);
    },
    isEmpty(data) {
      return data.repos.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderTraffic(data, config, ctx);
    },
  },
};
