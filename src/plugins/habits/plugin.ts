/**
 * Habits plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchHabits, type HabitsData } from "./source.ts";
import { renderHabits } from "./render.ts";

const HabitsPluginConfig = Zod.object({
  days: Zod.int().min(1).default(14),
  from: Zod.int().min(1).default(200),
  charts: Zod.boolean().default(false),
  facts: Zod.boolean().default(false),
});

export const habitsPlugin: Plugin<
  Zod.infer<typeof HabitsPluginConfig>,
  HabitsData
> = {
  id: "habits",
  source: {
    id: "habits",
    configSchema: HabitsPluginConfig,
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
