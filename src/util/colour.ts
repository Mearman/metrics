/**
 * Colour utilities for SVG rendering.
 *
 * Shared helpers for manipulating hex colours — lightening, darkening,
 * and extracting calendar colour levels from a theme.
 */

import type { Theme } from "../plugins/types.ts";

/**
 * Lighten a hex colour by a fixed amount (0–1).
 *
 * Mixes the colour toward white by the given proportion.
 */
export function lighten(hex: string, amount: number): string {
  const rv = parseInt(hex.slice(1, 3), 16);
  const gv = parseInt(hex.slice(3, 5), 16);
  const bv = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(rv + (255 - rv) * amount));
  const lg = Math.min(255, Math.round(gv + (255 - gv) * amount));
  const lb = Math.min(255, Math.round(bv + (255 - bv) * amount));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/**
 * Darken a hex colour by a fixed amount (0–1).
 *
 * Multiplies each channel by (1 - amount).
 */
export function darken(hex: string, amount: number): string {
  const rv = parseInt(hex.slice(1, 3), 16);
  const gv = parseInt(hex.slice(3, 5), 16);
  const bv = parseInt(hex.slice(5, 7), 16);
  const dr = Math.max(0, Math.round(rv * (1 - amount)));
  const dg = Math.max(0, Math.round(gv * (1 - amount)));
  const db = Math.max(0, Math.round(bv * (1 - amount)));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

/** The five contribution-level colour slots. */
export type CalendarLevel = "L0" | "L1" | "L2" | "L3" | "L4";

/**
 * Extract the five calendar contribution colours as a typed record.
 *
 * Destructures explicitly to avoid indexed access on the theme's
 * `calendar` record (which returns `string | undefined` under
 * `noUncheckedIndexedAccess`).
 */
export function calendarColours(theme: Theme): Record<CalendarLevel, string> {
  const { L0, L1, L2, L3, L4 } = theme.colours.calendar;
  return { L0, L1, L2, L3, L4 };
}
