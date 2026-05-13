/**
 * Calendar plugin — composes source and renderer.
 */

import * as z from "zod";
import type { Plugin } from "../types.ts";
import { fetchCalendar, type CalendarData, CalendarConfig } from "./source.ts";
import { renderCalendar } from "./render.ts";

export const calendarPlugin: Plugin<
  z.infer<typeof CalendarConfig>,
  CalendarData
> = {
  id: "calendar",
  source: {
    id: "calendar",
    configSchema: CalendarConfig,
    async fetch(ctx, config) {
      return await fetchCalendar(ctx, config);
    },
    isEmpty(data) {
      return data.years.length === 0;
    },
  },
  renderer: {
    render(data, config, ctx) {
      return renderCalendar(data, config, ctx);
    },
  },
};
