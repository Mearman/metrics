/**
 * Plugin registry — maps plugin IDs to their source + renderer.
 *
 * Plugins register themselves here. The pipeline looks up plugins
 * by ID when iterating the config's `plugins` keys.
 */

import type { Plugin } from "./types.ts";

const registry = new Map<string, Plugin<unknown, unknown>>();

/**
 * Register a plugin.
 *
 * @throws if a plugin with the same ID is already registered
 */
export function registerPlugin(plugin: Plugin<unknown, unknown>): void {
  const existing = registry.get(plugin.id);
  if (existing !== undefined) {
    throw new Error(
      `Plugin "${plugin.id}" is already registered. Each plugin ID must be unique.`,
    );
  }
  registry.set(plugin.id, plugin);
}

/**
 * Look up a plugin by ID.
 *
 * @returns the plugin, or `undefined` if not registered
 */
export function getPlugin(id: string): Plugin<unknown, unknown> | undefined {
  return registry.get(id);
}

/**
 * List all registered plugin IDs.
 */
export function listPlugins(): string[] {
  return [...registry.keys()];
}
