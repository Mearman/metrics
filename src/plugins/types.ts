/**
 * Core plugin interfaces.
 *
 * Each plugin composes two independent concerns:
 * - DataSource: fetches data from GitHub APIs
 * - Renderer: transforms data into SVG elements
 *
 * This separation follows the portable boundary principle — data fetching
 * and visual rendering are independently swappable.
 */

import type * as z from "zod";
import type { SvgElement } from "../render/svg/builder.ts";

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

/** Context passed to every data source during fetching. */
export interface FetchContext {
  /** Octokit wrapper for GraphQL + REST calls */
  api: ApiClient;
  /** GitHub username to generate metrics for */
  user: string;
  /** Abort signal for cancellation */
  signal: AbortSignal;
}

/** Context passed to every renderer. */
export interface RenderContext {
  /** Text measurement utility */
  measure: Measure;
  /** Current theme */
  theme: Theme;
  /** Octicon SVG path lookup */
  icons: IconLookup;
  /** Current Y position in the vertical stack */
  cursor: { y: number };
  /** Available content width in px */
  contentWidth: number;
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Result of a plugin's render phase. */
export interface RenderResult {
  /** Computed height in pixels of this section */
  height: number;
  /** SVG element tree for this section */
  elements: SvgElement[];
}

// ---------------------------------------------------------------------------
// Core interfaces
// ---------------------------------------------------------------------------

/** Fetches data from GitHub APIs. */
export interface DataSource<TConfig, TData> {
  /** Unique identifier (e.g. "languages", "isocalendar") */
  id: string;
  /** Zod schema for this data source's configuration */
  configSchema: z.ZodType<TConfig>;
  /** Fetch data from GitHub APIs */
  fetch(ctx: FetchContext, config: TConfig): Promise<TData>;
}

/** Renders data into visual elements. */
export interface Renderer<TData, TConfig> {
  /** Render SVG elements from fetched data */
  render(data: TData, config: TConfig, ctx: RenderContext): RenderResult;
}

/** A plugin composes a data source with a renderer. */
export interface Plugin<TConfig, TData> {
  /** Unique identifier */
  id: string;
  /** Data fetching logic */
  source: DataSource<TConfig, TData>;
  /** Visual rendering logic */
  renderer: Renderer<TData, TConfig>;
}

// ---------------------------------------------------------------------------
// Placeholder types — fleshed out in their own modules
// ---------------------------------------------------------------------------

/** API client abstraction (GraphQL + REST). TODO: define in src/api/client.ts */
export interface ApiClient {
  graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
  rest: object;
}

/** Text measurement utility. TODO: define in src/render/layout/measure.ts */
export interface Measure {
  textWidth(content: string, fontSize: number, fontWeight?: number): number;
  textBlockHeight(
    lines: string[],
    fontSize: number,
    lineHeight: number,
  ): number;
}

/** Theme definition. TODO: define in src/render/template/types.ts */
export interface Theme {
  width: number;
  sectionPadding: number;
  margin: number;
  fontStack: string;
  colours: {
    text: string;
    textSecondary: string;
    textTertiary: string;
    accent: string;
    background: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    calendar: {
      L0: string;
      L1: string;
      L2: string;
      L3: string;
      L4: string;
    };
  };
}

/** Octicon SVG path lookup. TODO: define in src/render/svg/icons.ts */
export interface IconLookup {
  get(name: string): string;
}
