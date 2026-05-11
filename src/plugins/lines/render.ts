/**
 * Lines plugin — renderer.
 *
 * Renders lines of code breakdown per repository.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { LinesData } from "./source.ts";

/** Format bytes to human-readable. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Render the lines of code section.
 */
export function renderLines(
  data: LinesData,
  _config: { sections?: string[]; repositories_limit?: number },
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;

  if (data.repos.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Title
  const titleY = 14;
  elements.push(
    text(padding, titleY, `Lines of code (${formatBytes(data.totalBytes)})`, {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let y = titleY + 24;

  for (const repo of data.repos) {
    // Repo name
    elements.push(
      text(padding + 8, y, repo.name, {
        fill: colours.text,
        "font-size": 12,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    // Size label
    elements.push(
      text(padding + contentWidth - 60, y, formatBytes(repo.totalBytes), {
        fill: colours.textTertiary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    y += 16;

    // Stacked bar for this repo
    let xOffset = padding + 8;
    const barWidth = contentWidth - 16;

    for (const lang of repo.languages) {
      const pct = lang.bytes / repo.totalBytes;
      const width = Math.max(pct * barWidth, 1);

      elements.push(
        rect(xOffset, y, width, 6, {
          fill: colours.accent,
          opacity: 0.7,
        }),
      );
      xOffset += width;
    }

    y += 16;
  }

  const totalHeight = y + padding - titleY;

  return { height: totalHeight, elements };
}
