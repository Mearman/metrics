/**
 * SVG serialiser — converts an SvgElement tree to a string.
 */

import type { SvgElement } from "./builder.ts";

/**
 * Serialise an SvgElement tree to an SVG string.
 *
 * Handles XML escaping for text content and attribute values.
 */
export function serialise(element: SvgElement): string {
  const attrs = serialiseAttrs(element.attrs);
  const tag = element.tag;

  if (element.text !== undefined) {
    // <style> content must not be XML-escaped — browsers parse
    // it as CSS, not XML. Wrap in CDATA for XML compliance.
    if (tag === "style") {
      return `<${tag}${attrs}><![CDATA[${element.text}]]></${tag}>`;
    }
    return `<${tag}${attrs}>${escapeXml(element.text)}</${tag}>`;
  }

  if (!element.children || element.children.length === 0) {
    return `<${tag}${attrs} />`;
  }

  const children = element.children.map((child) => serialise(child)).join("");
  return `<${tag}${attrs}>${children}</${tag}>`;
}

function serialiseAttrs(attrs: Record<string, string | number>): string {
  const entries = Object.entries(attrs);
  if (entries.length === 0) return "";

  return entries
    .map(([key, value]) => ` ${key}="${escapeXml(String(value))}"`)
    .join("");
}

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
