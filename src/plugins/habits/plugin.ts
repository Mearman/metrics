/**
 * Habits plugin — composes source and renderer.
 */

import type { Plugin } from "../types.ts";
import { fetchHabits, HabitsConfig, type HabitsData } from "./source.ts";
import { renderHabits } from "./render.ts";

export const habitsPlugin: Plugin<HabitsConfig, HabitsData> = {
  id: "habits",
  source: {
    id: "habits",
    configSchema: HabitsConfig,
    fetchKey: (config) => ({ days: config.days }),
    async fetch(ctx, config) {
      return await fetchHabits(ctx.api, ctx.user, config.days);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderHabits(data, config, ctx);
    },
  },
};
