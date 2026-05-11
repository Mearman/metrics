/**
 * Plugin registration — imports and registers all plugins.
 *
 * Import this module to populate the plugin registry.
 */

import { registerPlugin } from "./registry.ts";
import { basePlugin } from "./base/plugin.ts";
import { languagesPlugin } from "./languages/plugin.ts";

export function registerAllPlugins(): void {
  registerPlugin(basePlugin);
  registerPlugin(languagesPlugin);
  // TODO: Register remaining 27 plugins
}
