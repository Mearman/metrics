/**
 * Base plugin — wires source and renderer together.
 *
 * The base plugin renders the user profile header section:
 * avatar, name, login, bio, and key statistics.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchProfile, type UserProfile } from "./source.ts";
import { renderProfile } from "./render.ts";

const BasePluginConfig = Zod.object({
  sections: Zod.array(
    Zod.enum(["header", "activity", "community", "repositories", "metadata"]),
  ).default(["header", "activity", "community", "repositories", "metadata"]),
  indepth: Zod.boolean().default(false),
});

export const basePlugin: Plugin<
  Zod.infer<typeof BasePluginConfig>,
  UserProfile
> = {
  id: "base",
  source: {
    id: "base",
    configSchema: BasePluginConfig,
    async fetch(ctx) {
      return await fetchProfile(ctx.api, ctx.user);
    },
  },
  renderer: {
    render(data, _config, ctx) {
      void _config;
      return renderProfile(data, ctx);
    },
  },
};
