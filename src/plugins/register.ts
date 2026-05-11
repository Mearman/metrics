/**
 * Plugin registration — imports and registers all plugins.
 *
 * Import this module to populate the plugin registry.
 */

import { registerPlugin } from "./registry.ts";
import { basePlugin } from "./base/plugin.ts";
import { languagesPlugin } from "./languages/plugin.ts";
import { isocalendarPlugin } from "./isocalendar/plugin.ts";
import { habitsPlugin } from "./habits/plugin.ts";
import { achievementsPlugin } from "./achievements/plugin.ts";
import { linesPlugin } from "./lines/plugin.ts";

export function registerAllPlugins(): void {
  registerPlugin(basePlugin);
  registerPlugin(languagesPlugin);
  registerPlugin(isocalendarPlugin);
  registerPlugin(habitsPlugin);
  registerPlugin(achievementsPlugin);
  registerPlugin(linesPlugin);
}
