/**
 * Habits plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchHabits, type HabitsData } from "./source.ts";
import { renderHabits } from "./render.ts";

const HabitsPluginConfig = z.object({
  days: z.int().min(1).default(14),
  from: z.int().min(1).default(200),
  charts: z.boolean().default(false),
  facts: z.boolean().default(false),
});

export const habitsPlugin: Plugin<
  z.infer<typeof HabitsPluginConfig>,
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
