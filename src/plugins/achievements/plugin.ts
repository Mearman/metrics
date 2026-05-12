/**
 * Achievements plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchAchievements, type AchievementsData } from "./source.ts";
import { renderAchievements } from "./render.ts";

const AchievementsPluginConfig = z.object({
  display: z.enum(["compact", "detailed"]).default("detailed"),
  secrets: z.boolean().default(false),
  threshold: z.enum(["C", "B", "A", "S", "X"]).default("C"),
});

export const achievementsPlugin: Plugin<
  z.infer<typeof AchievementsPluginConfig>,
  AchievementsData
> = {
  id: "achievements",
  source: {
    id: "achievements",
    configSchema: AchievementsPluginConfig,
    async fetch(ctx) {
      return await fetchAchievements(ctx.api, ctx.user, ctx.repos);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderAchievements(data, config, ctx);
    },
  },
};
