/**
 * Plugin registry — maps plugin IDs to their source + renderer.
 *
 * Plugins register themselves here. The pipeline looks up plugins
 * by ID when iterating the config's `plugins` keys.
 *
 * Erasure strategy:
 * - **Config** is erased to `unknown` and re-parsed through Zod at
 *   each boundary (fetch, render, fetchKey). No type assertions.
 * - **Data** is NOT erased — the adapter stores the original typed
 *   plugin and delegates render calls directly. Data has no Zod
 *   schema so it cannot be narrowed from unknown.
 */

import type {
  Plugin,
  FetchContext,
  RenderContext,
  RenderResult,
} from "./types.ts";
import type * as z from "zod";

// ---------------------------------------------------------------------------
// Erased plugin interface
// ---------------------------------------------------------------------------

/** Plugin entry exposed to the pipeline. */
export interface ErasedPlugin {
  id: string;
  configSchema: z.ZodType;
  /** Fetch data. Config is Zod-parsed before passing to the typed source. */
  fetch(ctx: FetchContext, config: unknown): Promise<unknown>;
  /** Compute a fetch-specific cache key. Config is Zod-parsed. */
  computeFetchKey?(config: unknown): Record<string, unknown>;
  /** Render data. Delegates to the original typed renderer. */
  render(data: unknown, config: unknown, ctx: RenderContext): RenderResult;
}

// ---------------------------------------------------------------------------
// Adapter — wraps a typed plugin with Zod config narrowing
// ---------------------------------------------------------------------------

/**
 * Typed adapter that holds the original plugin.
 *
 * Config is narrowed through `schema.parse()` at every boundary.
 * Data is passed directly to the typed renderer without narrowing —
 * it originates from the typed `source.fetch()` call above.
 */
class PluginAdapter<TConfig, TData> implements ErasedPlugin {
  readonly id: string;
  readonly configSchema: z.ZodType;
  private readonly source: Plugin<TConfig, TData>["source"];
  private readonly renderer: Plugin<TConfig, TData>["renderer"];
  private readonly schema: z.ZodType<TConfig>;
  private readonly fetchKeyFn:
    | ((config: TConfig) => Record<string, unknown>)
    | undefined;

  constructor(plugin: Plugin<TConfig, TData>) {
    this.id = plugin.id;
    this.schema = plugin.source.configSchema;
    this.configSchema = this.schema;
    this.source = plugin.source;
    this.renderer = plugin.renderer;
    this.fetchKeyFn = plugin.source.fetchKey ?? undefined;
  }

  async fetch(ctx: FetchContext, config: unknown): Promise<unknown> {
    const parsed = this.schema.parse(config);
    return this.source.fetch(ctx, parsed);
  }

  render(data: unknown, config: unknown, ctx: RenderContext): RenderResult {
    const parsed = this.schema.parse(config);
    // render receives unknown but the data IS TData — it comes from
    // this.fetch() above. We pass it to the typed renderer directly.
    // The type system can't verify this, but the data flow is:
    //   this.fetch() → Promise<TData> → cache → this.render(data)
    // Since the adapter is the only path to fetch and render, the
    // invariant holds by construction.
    return this.renderTyped(data, parsed, ctx);
  }

  /** Separate method to confine the unavoidable widening. */
  private renderTyped(
    data: unknown,
    config: TConfig,
    ctx: RenderContext,
  ): RenderResult {
    // The Renderer interface accepts TData but we have unknown.
    // We widen the renderer's accepted type by calling it through
    // a helper that treats the renderer as accepting unknown data.
    interface UnknownDataRenderer {
      render(d: unknown, c: TConfig, x: RenderContext): RenderResult;
    }
    const widened: UnknownDataRenderer = this.renderer;
    return widened.render(data, config, ctx);
  }

  computeFetchKey(config: unknown): Record<string, unknown> {
    if (this.fetchKeyFn === undefined) {
      return {};
    }
    const parsed = this.schema.safeParse(config);
    if (!parsed.success) {
      return { _invalid: JSON.stringify(config) };
    }
    return this.fetchKeyFn(parsed.data);
  }

  get hasFetchKey(): boolean {
    return this.fetchKeyFn !== undefined;
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const registry = new Map<string, ErasedPlugin>();

/**
 * Register a plugin.
 *
 * @throws if a plugin with the same ID is already registered
 */
export function registerPlugin<TConfig, TData>(
  plugin: Plugin<TConfig, TData>,
): void {
  const existing = registry.get(plugin.id);
  if (existing !== undefined) {
    throw new Error(
      `Plugin "${plugin.id}" is already registered. Each plugin ID must be unique.`,
    );
  }
  registry.set(plugin.id, new PluginAdapter(plugin));
}

/**
 * Look up a plugin by ID.
 *
 * @returns the plugin, or `undefined` if not registered
 */
export function getPlugin(id: string): ErasedPlugin | undefined {
  return registry.get(id);
}

/**
 * List all registered plugin IDs.
 */
export function listPlugins(): string[] {
  return [...registry.keys()];
}
