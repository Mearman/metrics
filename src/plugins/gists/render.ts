import * as z from "zod";
/**
 * Gists plugin — renderer.
 *
 * Renders gist statistics as a stat card.
 */

import { text } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { GistsConfig } from "./source.ts";
import type { GistsData } from "./source.ts";

/**
 * Render gist statistics.
 */
export function renderGists(
  data: GistsData,
  config: z.input<typeof GistsConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Gists", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  if (data.totalCount === 0) {
    elements.push(
      text(padding, 34, "No public gists", {
        fill: colours.textTertiary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );
    return { height: 50, elements };
  }

  // Stat grid
  const stats = [
    { label: "Gists", value: String(data.totalCount) },
    { label: "Files", value: String(data.files) },
    { label: "Stars", value: String(data.stargazers) },
    { label: "Forks", value: String(data.forks) },
    { label: "Comments", value: String(data.comments) },
  ];

  const statSpacing = ctx.contentWidth / stats.length;

  let col = 0;
  for (const stat of stats) {
    const colX = padding + col * statSpacing;
    const colCentre = colX + statSpacing / 2;
    const valueWidth = ctx.measure.textWidth(stat.value, 16);
    const labelWidth = ctx.measure.textWidth(stat.label, 10);

    elements.push(
      text(colCentre - valueWidth / 2, 40, stat.value, {
        fill: colours.text,
        "font-size": 16,
        "font-weight": 700,
        "font-family": fontStack,
      }),
    );

    elements.push(
      text(colCentre - labelWidth / 2, 56, stat.label, {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );

    col++;
  }

  return { height: 70 + padding, elements };
}
