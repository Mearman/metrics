/**
 * Base plugin — wires source and renderer together.
 *
 * The base plugin renders the user profile header section:
 * avatar, name, login, bio, and key statistics.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchProfile, type UserProfile } from "./source.ts";
import { renderProfile } from "./render.ts";

const BasePluginConfig = z.object({
  sections: z
    .array(
      z.enum(["header", "activity", "community", "repositories", "metadata"]),
    )
    .default(["header", "activity", "community", "repositories", "metadata"]),
  indepth: z.boolean().default(false),
});

export const basePlugin: Plugin<
  z.infer<typeof BasePluginConfig>,
  UserProfile
> = {
  id: "base",
  source: {
    id: "base",
    configSchema: BasePluginConfig,
    async fetch(ctx) {
      return await fetchProfile(ctx.api, ctx.user, ctx.repos);
    },
  },
  renderer: {
    render(data, _config, ctx) {
      void _config;
      return renderProfile(data, ctx);
    },
  },
};
