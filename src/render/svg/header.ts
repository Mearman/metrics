/**
 * Section header rendering — icon + title with accent underline.
 *
 * Every plugin section uses the same visual treatment:
 * a 16×16 octicon followed by bold title text, with a thin
 * accent-coloured underline spanning the content width.
 */

import { text, rect, path, g } from "./builder.ts";
import type { SvgElement } from "./builder.ts";
import type { RenderContext } from "../../plugins/types.ts";

/** Icon names for each plugin section. Maps plugin/theme IDs to octicon names. */
const SECTION_ICONS: Record<string, string> = {
  achievements: "trophy",
  activity: "history",
  base: "mark-github",
  calendar: "calendar",
  code: "code",
  contributors: "people",
  discussions: "comment-discussion",
  followup: "bell",
  gists: "note",
  habits: "graph",
  introduction: "home",
  isocalendar: "graph-bar-vertical",
  languages: "code",
  licenses: "law",
  lines: "code-of-conduct",
  loc: "file-code",
  notable: "star",
  people: "organization",
  projects: "list",
  reactions: "smiley",
  repositories: "repo",
  rss: "rss",
  skyline: "globe",
  sponsors: "heart",
  sponsorships: "credit-card",
  stargazers: "star",
  stars: "star-fill",
  topics: "tag",
  traffic: "pulse",
};

/**
 * Render a section header with icon, title, and optional underline.
 *
 * @param title - Section title text
 * @param ctx - Render context (theme, icons, content width)
 * @param opts - Options
 * @param opts.pluginId - Plugin ID for icon lookup (falls back to first word of title)
 * @param opts.underline - Whether to draw an accent underline (default true)
 * @returns Object with header elements and the Y offset for content below
 */
export function sectionHeader(
  title: string,
  ctx: RenderContext,
  opts?: { pluginId?: string; underline?: boolean; y?: number },
): { elements: SvgElement[]; contentY: number } {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const showUnderline = opts?.underline !== false;
  const baseY = opts?.y ?? 0;

  // Resolve icon
  const pluginId = opts?.pluginId ?? title.toLowerCase().split(" ")[0] ?? "";
  const iconName = SECTION_ICONS[pluginId] ?? "";
  const iconPath = ctx.icons.get(iconName);

  const headerElements: SvgElement[] = [];

  if (iconPath.length > 0) {
    // Icon + title side by side
    const iconSize = 16;
    const iconGap = 6;

    headerElements.push(
      g(
        { transform: `translate(${String(padding)},${String(baseY)})` },
        path(`M0 0h${String(iconSize)}v${String(iconSize)}H0z`, {
          fill: "none",
        }),
        path(iconPath, {
          fill: colours.accent,
          transform: "scale(1)",
        }),
      ),
    );

    headerElements.push(
      text(padding + iconSize + iconGap, baseY + 13, title, {
        fill: colours.text,
        "font-size": 14,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );
  } else {
    // Fallback: plain text title
    headerElements.push(
      text(padding, baseY + 14, title, {
        fill: colours.text,
        "font-size": 14,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );
  }

  // Accent underline
  if (showUnderline) {
    headerElements.push(
      rect(padding, baseY + 21, ctx.contentWidth, 1.5, {
        fill: colours.accent,
        opacity: 0.25,
        rx: 1,
      }),
    );
  }

  const contentY = baseY + 28;

  return { elements: headerElements, contentY };
}
