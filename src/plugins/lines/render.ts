/**
 * Lines plugin — renderer.
 *
 * Renders code size breakdown per repository as proportional
 * stacked bars with per-language colour coding.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { LinesData } from "./source.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format bytes to human-readable. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const TITLE_FONT_SIZE = 14;
const TITLE_Y = 14;

const REPO_NAME_FONT_SIZE = 12;
const SIZE_LABEL_FONT_SIZE = 11;

const BAR_HEIGHT = 6;
const BAR_RX = 3;

/** Gap between bar bottom and next repo name baseline. */
const BAR_BELOW_GAP = 6;

/** Gap between repo name baseline and bar top. */
const TEXT_BELOW_GAP = 4;

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/**
 * Render the code size section.
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
  elements.push(
    text(padding, TITLE_Y, `Code size (${formatBytes(data.totalBytes)})`, {
      fill: colours.text,
      "font-size": TITLE_FONT_SIZE,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  // Largest repo determines the full bar width — other repos are
  // proportional so the viewer can compare relative sizes at a glance.
  const maxBytes = Math.max(...data.repos.map((r) => r.totalBytes));
  const fullBarWidth = contentWidth - 16;

  let y = TITLE_Y + 22;

  for (const repo of data.repos) {
    // Repo name (left-aligned)
    elements.push(
      text(padding + 8, y + REPO_NAME_FONT_SIZE - 2, repo.name, {
        fill: colours.text,
        "font-size": REPO_NAME_FONT_SIZE,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    // Size label (right-aligned by placing at right edge)
    const sizeText = formatBytes(repo.totalBytes);
    const sizeWidth = ctx.measure.textWidth(sizeText, SIZE_LABEL_FONT_SIZE);
    elements.push(
      text(
        padding + contentWidth - sizeWidth,
        y + SIZE_LABEL_FONT_SIZE,
        sizeText,
        {
          fill: colours.textTertiary,
          "font-size": SIZE_LABEL_FONT_SIZE,
          "font-family": fontStack,
        },
      ),
    );

    // Advance past the text line to where the bar starts
    y += REPO_NAME_FONT_SIZE + TEXT_BELOW_GAP;

    // Stacked bar — width proportional to this repo vs the largest
    const repoBarWidth = (repo.totalBytes / maxBytes) * fullBarWidth;
    let xOffset = padding + 8;

    for (const lang of repo.languages) {
      const pct = lang.bytes / repo.totalBytes;
      const width = Math.max(pct * repoBarWidth, 1);

      elements.push(
        rect(xOffset, y, width, BAR_HEIGHT, {
          fill: lang.colour,
          rx: BAR_RX,
        }),
      );
      xOffset += width;
    }

    // Advance past the bar
    y += BAR_HEIGHT + BAR_BELOW_GAP + REPO_NAME_FONT_SIZE;
  }

  const totalHeight = y + padding - TITLE_Y;

  return { height: totalHeight, elements };
}
