/**
 * Skyline plugin — composes source and renderer.
 *
 * Renders the contribution calendar as a 3D isometric cityscape.
 * Each day's contributions become a building column whose height
 * is proportional to the contribution count.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import type { IsocalendarData } from "../isocalendar/source.ts";
import { skylineSource, SkylineConfig } from "./source.ts";
import { renderSkyline } from "./render.ts";

export const skylinePlugin: Plugin<
  z.infer<typeof SkylineConfig>,
  IsocalendarData
> = {
  id: "skyline",
  source: skylineSource,
  renderer: {
    render(data, config, ctx) {
      return renderSkyline(data, config, ctx);
    },
  },
};
