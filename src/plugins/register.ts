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
import { repositoriesPlugin } from "./repositories/plugin.ts";
import { activityPlugin } from "./activity/plugin.ts";
import { starsPlugin } from "./stars/plugin.ts";
import { followupPlugin } from "./followup/plugin.ts";
import { stargazersPlugin } from "./stargazers/plugin.ts";
import { peoplePlugin } from "./people/plugin.ts";
import { gistsPlugin } from "./gists/plugin.ts";
import { discussionsPlugin } from "./discussions/plugin.ts";
import { notablePlugin } from "./notable/plugin.ts";
import { calendarPlugin } from "./calendar/plugin.ts";
import { introductionPlugin } from "./introduction/plugin.ts";
import { reactionsPlugin } from "./reactions/plugin.ts";
import { contributorsPlugin } from "./contributors/plugin.ts";

export function registerAllPlugins(): void {
  registerPlugin(basePlugin);
  registerPlugin(languagesPlugin);
  registerPlugin(isocalendarPlugin);
  registerPlugin(habitsPlugin);
  registerPlugin(achievementsPlugin);
  registerPlugin(linesPlugin);
  registerPlugin(repositoriesPlugin);
  registerPlugin(activityPlugin);
  registerPlugin(starsPlugin);
  registerPlugin(followupPlugin);
  registerPlugin(stargazersPlugin);
  registerPlugin(peoplePlugin);
  registerPlugin(gistsPlugin);
  registerPlugin(discussionsPlugin);
  registerPlugin(notablePlugin);
  registerPlugin(calendarPlugin);
  registerPlugin(introductionPlugin);
  registerPlugin(reactionsPlugin);
  registerPlugin(contributorsPlugin);
}
