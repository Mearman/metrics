/**
 * Achievements plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchAchievements, type AchievementsData } from "./source.ts";
import { renderAchievements } from "./render.ts";

const AchievementsPluginConfig = Zod.object({
  display: Zod.enum(["compact", "detailed"]).default("detailed"),
  secrets: Zod.boolean().default(false),
  threshold: Zod.enum(["C", "B", "A", "S", "X"]).default("C"),
});

export const achievementsPlugin: Plugin<
  Zod.infer<typeof AchievementsPluginConfig>,
  AchievementsData
> = {
  id: "achievements",
  source: {
    id: "achievements",
    configSchema: AchievementsPluginConfig,
    async fetch(ctx) {
      return await fetchAchievements(ctx.api, ctx.user);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderAchievements(data, config, ctx);
    },
  },
};
