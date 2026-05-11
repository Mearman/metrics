/**
 * Octicon SVG path lookup.
 *
 * Provides SVG path data for GitHub Octicons at 16px size.
 * The path data is extracted from the @primer/octicons package.
 */

import allOcticons from "@primer/octicons";
import type { Icon } from "@primer/octicons";
import type { IconLookup } from "../../plugins/types.ts";

/** Default icon size in pixels. */
const ICON_SIZE = 16;

/**
 * Safely look up an icon by name from the octicons package.
 *
 * The octicons package exports a Record<IconName, Icon>, but we need
 * to index by a dynamic string. This function uses `in` to narrow
 * safely without type assertions.
 */
function findIcon(
  octicons: Record<string, Icon>,
  name: string,
): Icon | undefined {
  if (name in octicons) {
    return octicons[name];
  }
  return undefined;
}

/**
 * Extract the `d` attribute from an Octicon path element string.
 *
 * The @primer/octicons package gives us `<path d="..."></path>` strings.
 * We only need the `d` attribute value for our SVG builder.
 */
function extractPathD(pathElement: string): string {
  const match = /d="([^"]+)"/.exec(pathElement);
  if (match?.[1] === undefined) {
    throw new Error(`Could not extract path data from: ${pathElement}`);
  }
  return match[1];
}

/**
 * Create an Octicon SVG path lookup.
 *
 * @param size - Icon size (16 or 24)
 */
export function createIconLookup(size: 16 | 24 = ICON_SIZE): IconLookup {
  return {
    get(name: string): string {
      const icon = findIcon(allOcticons, name);
      if (icon === undefined) {
        return "";
      }
      const heightData = icon.heights[size];
      if (heightData === undefined) {
        return "";
      }
      return extractPathD(heightData.path);
    },
  };
}
