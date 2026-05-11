/**
 * Template interface.
 *
 * A template is a set of renderer implementations for each plugin,
 * plus a layout strategy and a theme. Templates are the mechanism
 * for varying visual output without touching plugin data sources.
 */

import type { RenderResult, Renderer, Theme } from "../../plugins/types.ts";
import type { SvgElement } from "../svg/builder.ts";

export interface Template {
  /** Unique identifier (e.g. "classic", "terminal") */
  id: string;

  /** Colour palette and spacing constants */
  theme: Theme;

  /** Map plugin IDs to their renderer for this template */
  renderers: Record<string, Renderer<unknown, unknown>>;

  /** Overall layout — stack plugin sections into a final SVG */
  layout(sections: RenderResult[], theme: Theme): SvgElement;
}
