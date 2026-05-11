/**
 * Calendar plugin — composes source and renderer.
 */

import * as Zod from "zod";
import type { Plugin } from "../types.ts";
import { fetchCalendar, type CalendarData, CalendarConfig } from "./source.ts";
import { renderCalendar } from "./render.ts";

export const calendarPlugin: Plugin<
  Zod.infer<typeof CalendarConfig>,
  CalendarData
> = {
  id: "calendar",
  source: {
    id: "calendar",
    configSchema: CalendarConfig,
    async fetch(ctx, config) {
      return await fetchCalendar(ctx, config);
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderCalendar(data, config, ctx);
    },
  },
};
