/**
 * Stars plugin — renderer.
 *
 * Renders recently starred repositories as a compact list.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { StarsData } from "./source.ts";

/**
 * Render recently starred repositories.
 */
export function renderStars(
  data: StarsData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.repositories.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Section title
  elements.push(
    text(padding, 14, "Recently starred", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let yCursor = 32;

  for (const repo of data.repositories) {
    // Repo name
    elements.push(
      text(padding + 16, yCursor, `★ ${repo.nameWithOwner}`, {
        fill: colours.text,
        "font-size": 12,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    // Language + stars on the right
    const parts: string[] = [];
    if (repo.primaryLanguage) {
      parts.push(repo.primaryLanguage.name);
    }
    parts.push(`★ ${String(repo.stargazerCount)}`);
    const metaText = parts.join(" · ");
    const metaWidth = ctx.measure.textWidth(metaText, 11);
    elements.push(
      text(ctx.theme.width - padding - metaWidth, yCursor, metaText, {
        fill: colours.textTertiary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    yCursor += 18;

    // Description (truncated)
    if (repo.description) {
      const maxDescWidth = ctx.contentWidth - 16;
      const truncated = truncateText(repo.description, maxDescWidth, 11, ctx);
      elements.push(
        text(padding + 16, yCursor, truncated, {
          fill: colours.textSecondary,
          "font-size": 11,
          "font-family": fontStack,
        }),
      );
      yCursor += 16;
    }

    // Language dot
    if (repo.primaryLanguage) {
      elements.push(
        rect(padding + 16, yCursor - 4, 8, 8, {
          fill: repo.primaryLanguage.color,
          rx: 2,
        }),
      );
      elements.push(
        text(padding + 28, yCursor + 3, repo.primaryLanguage.name, {
          fill: colours.textTertiary,
          "font-size": 10,
          "font-family": fontStack,
        }),
      );
    }

    yCursor += 18;
  }

  return { height: yCursor + padding, elements };
}

function truncateText(
  content: string,
  maxWidth: number,
  fontSize: number,
  ctx: RenderContext,
): string {
  if (ctx.measure.textWidth(content, fontSize) <= maxWidth) return content;
  let truncated = content;
  while (truncated.length > 0) {
    truncated = truncated.slice(0, -1);
    if (ctx.measure.textWidth(`${truncated}…`, fontSize) <= maxWidth) {
      return `${truncated}…`;
    }
  }
  return "…";
}
