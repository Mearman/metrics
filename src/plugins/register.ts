/**
 * Plugin registration — imports and registers all plugins.
 *
 * Import this module to populate the plugin registry.
 */

import { registerPlugin } from "./registry.ts";
import { basePlugin } from "./base/plugin.ts";

export function registerAllPlugins(): void {
  registerPlugin(basePlugin);
  // TODO: Register remaining 28 plugins
}
