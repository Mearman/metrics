/**
 * Stargazers plugin — renderer.
 *
 * Renders a horizontal bar chart of star counts per repo.
 */

import * as z from "zod";
import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import { shouldEnumerate } from "../../repos/filter.ts";
import type { RepoProperties } from "../../repos/filter.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { StargazersConfig } from "./source.ts";
import type { StargazersData } from "./source.ts";

/**
 * Render stargazer breakdown as a horizontal bar chart.
 */
export function renderStargazers(
  data: StargazersData,
  config: z.input<typeof StargazersConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.repos.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const maxStars = Math.max(...data.repos.map((r) => r.stars), 1);

  elements.push(
    text(padding, 14, `⭐ ${String(data.totalStars)} total stars`, {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  const startY = 32;
  const barHeight = 12;
  const barGap = 6;
  const labelWidth = 120;
  const barMaxWidth = ctx.contentWidth - labelWidth - 8;

  let row = 0;
  for (const repo of data.repos) {
    // Skip repos that shouldn't be named
    if (!shouldEnumerate(toRepoProps(repo), ctx.repos.rules)) continue;

    const y = startY + row * (barHeight + barGap);

    // Repo name (left, truncated to fit label area)
    const displayName = truncateText(
      repo.name,
      labelWidth - 8,
      11,
      ctx.measure,
    );
    elements.push(
      text(padding, y + barHeight - 2, displayName, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    // Bar
    const barWidth = maxStars > 0 ? (repo.stars / maxStars) * barMaxWidth : 0;
    elements.push(
      rect(padding + labelWidth, y, Math.max(barWidth, 1), barHeight, {
        fill: "#e3b341",
        rx: 3,
        opacity: 0.7,
      }),
    );

    // Star count
    elements.push(
      text(
        padding + labelWidth + barWidth + 6,
        y + barHeight - 2,
        String(repo.stars),
        {
          fill: colours.textTertiary,
          "font-size": 10,
          "font-family": fontStack,
        },
      ),
    );

    row++;
  }

  const totalHeight =
    startY + data.repos.length * (barHeight + barGap) + padding;

  return { height: totalHeight, elements };
}

/** Convert a StargazersData repo to RepoProperties for filter matching. */
function toRepoProps(repo: {
  name: string;
  isPrivate: boolean;
}): RepoProperties {
  const slashIndex = repo.name.indexOf("/");
  return {
    name: repo.name,
    isPrivate: repo.isPrivate,
    owner: slashIndex >= 0 ? repo.name.slice(0, slashIndex) : repo.name,
    topics: [],
    language: null,
  };
}
