/**
 * Traffic plugin — renderer.
 *
 * Renders repository view counts as a horizontal bar chart.
 */

import * as z from "zod";
import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import { shouldEnumerate } from "../../repos/filter.ts";
import type { RepoProperties } from "../../repos/filter.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { TrafficConfig } from "./source.ts";
import type { TrafficData } from "./source.ts";
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

export function renderTraffic(
  data: TrafficData,
  config: z.input<typeof TrafficConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.repos.length === 0) {
    return emptySection("Traffic", "No repository traffic data available", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems } = sectionHeader(
    `Traffic (${String(data.totalViews)} views)`,
    ctx,
    {
      pluginId: "traffic",
    },
  );
  elements.push(...headerElems);

  const labelWidth = 160;
  const barMaxWidth = ctx.contentWidth - labelWidth - 50;
  const maxViews = Math.max(...data.repos.map((r) => r.views), 1);
  const barHeight = 12;
  const fontName = 11;
  const fontCount = 10;

  let y = 32;

  for (const repo of data.repos) {
    // Skip repos that shouldn't be named
    if (!shouldEnumerate(toRepoProps(repo), ctx.repos.rules)) continue;

    // Repo name
    const name = truncateText(repo.name, labelWidth - 8, fontName, ctx.measure);
    elements.push(
      text(padding, y + fontName, name, {
        fill: colours.textSecondary,
        "font-size": fontName,
        "font-family": fontStack,
      }),
    );

    // Bar
    const barWidth = (repo.views / maxViews) * barMaxWidth;
    elements.push(
      rect(padding + labelWidth, y, Math.max(barWidth, 1), barHeight, {
        fill: colours.accent,
        opacity: 0.7,
        rx: 3,
      }),
    );

    // Count (right-aligned to content edge)
    const countText = `${String(repo.views)} (${String(repo.uniques)} unique)`;
    const countWidth = ctx.measure.textWidth(countText, fontCount);
    const countX = padding + ctx.contentWidth - countWidth;
    elements.push(
      text(countX, y + fontCount, countText, {
        fill: colours.textTertiary,
        "font-size": fontCount,
        "font-family": fontStack,
      }),
    );

    y += barHeight + 8;
  }

  return { height: y + padding, elements };
}

/** Convert a TrafficData repo to RepoProperties for filter matching. */
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
