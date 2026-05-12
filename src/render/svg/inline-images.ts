/**
 * Inline external images — fetches appropriately-sized avatar
 * images and embeds as base64 data URIs in the SVG output.
 *
 * Browsers block cross-origin image loads in SVGs served from
 * different origins (e.g. GitHub Pages loading avatars from
 * avatars.githubusercontent.com). Embedding images inline avoids
 * this restriction entirely.
 *
 * GitHub's CDN supports the `s` query parameter to return
 * pre-resized images, so we request the display size directly
 * instead of downloading full-size images and resizing locally.
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
 * Optimise GitHub avatar URLs by requesting a size-appropriate
 * version. GitHub's CDN supports the `s` query parameter to
 * return pre-resized images, reducing download size significantly.
 */
function optimiseAvatarUrl(url: string, displaySize: number): string {
  if (
    url.includes("avatars.githubusercontent.com") ||
    url.includes("avatars0.githubusercontent.com") ||
    url.includes("avatars1.githubusercontent.com") ||
    url.includes("avatars2.githubusercontent.com") ||
    url.includes("avatars3.githubusercontent.com")
  ) {
    // Request 2x for retina sharpness
    const pixelSize = displaySize * 2;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}s=${String(pixelSize)}`;
  }
  return url;
}

/**
 * Walk an SvgElement tree and inline all external image hrefs.
 *
 * Requests appropriately-sized images from CDN (GitHub avatars).
 * Only processes `<image>` elements with `href` starting with "http".
 */
export async function inlineImages(element: SvgElement): Promise<SvgElement> {
  if (
    element.tag === "image" &&
    element.attrs.href !== undefined &&
    typeof element.attrs.href === "string" &&
    element.attrs.href.startsWith("http")
  ) {
    const displaySize =
      typeof element.attrs.width === "number" ? element.attrs.width : 32;
    const optimisedUrl = optimiseAvatarUrl(element.attrs.href, displaySize);
    const dataUri = await fetchAsDataUri(optimisedUrl);
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
 * Clear the image fetch cache.
 */
export function clearImageCache(): void {
  cache.clear();
}
