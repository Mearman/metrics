/**
 * Stars plugin — renderer.
 *
 * Renders recently starred repositories as a compact list.
 */

import * as z from "zod";
import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { StarsConfig } from "./source.ts";
import type { StarsData } from "./source.ts";
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

/**
 * Render recently starred repositories.
 */
export function renderStars(
  data: StarsData,
  config: z.input<typeof StarsConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.repositories.length === 0) {
    return emptySection(
      "Recently starred",
      "No recently starred repositories",
      ctx,
    );
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Section title
  // Header with icon
  const { elements: headerElems } = sectionHeader("Recently starred", ctx, {
    pluginId: "stars",
  });
  elements.push(...headerElems);

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
      const truncated = truncateText(
        repo.description,
        maxDescWidth,
        11,
        ctx.measure,
      );
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
