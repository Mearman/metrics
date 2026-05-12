/**
 * Inline external images — fetches remote image URLs and replaces
 * them with base64 data URIs in the SVG output.
 *
 * Browsers block cross-origin image loads in SVGs served from
 * different origins (e.g. GitHub Pages loading avatars from
 * avatars.githubusercontent.com). Embedding images inline avoids
 * this restriction entirely.
 */

import type { SvgElement } from "./builder.ts";

/**
 * Fetch an image URL and return it as a base64 data URI.
 *
 * Caches results to avoid re-fetching the same URL.
 */
const cache = new Map<string, string>();

async function fetchAsDataUri(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "metrics-svg-generator" },
    });
    if (!response.ok) return url;

    const contentType = response.headers.get("content-type") ?? "image/png";
    const buffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCodePoint(byte),
        "",
      ),
    );

    const dataUri = `data:${contentType};base64,${base64}`;
    cache.set(url, dataUri);
    return dataUri;
  } catch {
    // If fetch fails, keep the original URL
    return url;
  }
}

/**
 * Walk an SvgElement tree and inline all external image hrefs.
 *
 * Only processes `<image>` elements with `href` starting with "http".
 */
export async function inlineImages(element: SvgElement): Promise<SvgElement> {
  if (
    element.tag === "image" &&
    element.attrs.href !== undefined &&
    typeof element.attrs.href === "string" &&
    element.attrs.href.startsWith("http")
  ) {
    const dataUri = await fetchAsDataUri(element.attrs.href);
    return {
      ...element,
      attrs: { ...element.attrs, href: dataUri },
    };
  }

  if (element.children !== undefined && element.children.length > 0) {
    const inlined = await Promise.all(
      element.children.map((child) => inlineImages(child)),
    );
    return { ...element, children: inlined };
  }

  return element;
}

/**
 * Clear the avatar fetch cache.
 */
export function clearImageCache(): void {
  cache.clear();
}
