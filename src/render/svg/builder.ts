/**
 * Typed SVG element builder.
 *
 * Produces element objects — not strings. The serialiser converts
 * the tree to an SVG string later. This enables deterministic
 * layout computation before any output happens.
 */

/** A node in the SVG element tree. */
export interface SvgElement {
  tag: string;
  attrs: Record<string, string | number>;
  children?: SvgElement[];
  text?: string;
}

// ---------------------------------------------------------------------------
// Builder functions
// ---------------------------------------------------------------------------

export function svg(
  attrs: Record<string, string | number>,
  ...children: SvgElement[]
): SvgElement {
  return { tag: "svg", attrs, children };
}

export function g(
  attrs: Record<string, string | number>,
  ...children: SvgElement[]
): SvgElement {
  return { tag: "g", attrs, children };
}

export function text(
  x: number,
  y: number,
  content: string,
  opts: Record<string, string | number> = {},
): SvgElement {
  return {
    tag: "text",
    attrs: { x, y, ...opts },
    text: content,
  };
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  opts: Record<string, string | number> = {},
): SvgElement {
  return {
    tag: "rect",
    attrs: { x, y, width, height, ...opts },
  };
}

export function circle(
  cx: number,
  cy: number,
  r: number,
  opts: Record<string, string | number> = {},
): SvgElement {
  return { tag: "circle", attrs: { cx, cy, r, ...opts } };
}

export function path(
  d: string,
  opts: Record<string, string | number> = {},
): SvgElement {
  return { tag: "path", attrs: { d, ...opts } };
}

export function image(
  x: number,
  y: number,
  width: number,
  height: number,
  href: string,
): SvgElement {
  return { tag: "image", attrs: { x, y, width, height, href } };
}

export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: Record<string, string | number> = {},
): SvgElement {
  return { tag: "line", attrs: { x1, y1, x2, y2, ...opts } };
}
