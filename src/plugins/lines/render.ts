/**
 * Lines plugin — renderer.
 *
 * Renders code size breakdown per repository as proportional
 * stacked bars with per-language colour coding.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import { shouldEnumerate } from "../../repos/filter.ts";
import type { RepoProperties } from "../../repos/filter.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { LinesData, LinesConfig } from "./source.ts";
import * as z from "zod";
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format bytes to human-readable. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Collect top languages across all repos, sorted by total bytes. */
function collectLanguages(
  repos: LinesData["repos"],
  max: number,
): { name: string; colour: string }[] {
  const totals = new Map<string, { bytes: number; colour: string }>();
  for (const repo of repos) {
    for (const lang of repo.languages) {
      const existing = totals.get(lang.name);
      if (existing !== undefined) {
        existing.bytes += lang.bytes;
      } else {
        totals.set(lang.name, { bytes: lang.bytes, colour: lang.colour });
      }
    }
  }
  return [...totals]
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, max)
    .map(([name, { colour }]) => ({ name, colour }));
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const REPO_NAME_FONT_SIZE = 12;
const SIZE_LABEL_FONT_SIZE = 11;

const BAR_HEIGHT = 6;
const BAR_RX = 3;

/** Gap between bar bottom and next repo name baseline. */
const BAR_BELOW_GAP = 6;

/** Gap between repo name baseline and bar top. */
const TEXT_BELOW_GAP = 4;

const LEGEND_FONT_SIZE = 10;
const LEGEND_SQUARE = 8;
const LEGEND_GAP = 4;
const LEGEND_ENTRY_GAP = 16;
const MAX_LEGEND_LANGUAGES = 8;

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/**
 * Render the code size section.
 */
export function renderLines(
  data: LinesData,
  config: z.input<typeof LinesConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;

  if (data.repos.length === 0) {
    return emptySection("Lines", "No code size data available", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems, contentY } = sectionHeader(
    `Code size (${formatBytes(data.totalBytes)})`,
    ctx,
    { pluginId: "lines" },
  );
  elements.push(...headerElems);

  // Language legend
  const visibleRepos = data.repos.filter((r) =>
    shouldEnumerate(toRepoProps(r), ctx.repos.rules),
  );
  const legendLangs = collectLanguages(visibleRepos, MAX_LEGEND_LANGUAGES);

  let y = contentY + 14;

  if (legendLangs.length > 0) {
    let legendX = padding + 8;

    for (const lang of legendLangs) {
      elements.push(
        rect(legendX, y, LEGEND_SQUARE, LEGEND_SQUARE, {
          fill: lang.colour,
          rx: 1,
        }),
      );
      const label = truncateText(lang.name, 80, LEGEND_FONT_SIZE, ctx.measure);
      elements.push(
        text(
          legendX + LEGEND_SQUARE + LEGEND_GAP,
          y + LEGEND_FONT_SIZE - 1,
          label,
          {
            fill: colours.textTertiary,
            "font-size": LEGEND_FONT_SIZE,
            "font-family": fontStack,
          },
        ),
      );
      const labelWidth = ctx.measure.textWidth(label, LEGEND_FONT_SIZE);
      legendX += LEGEND_SQUARE + LEGEND_GAP + labelWidth + LEGEND_ENTRY_GAP;

      if (legendX > padding + contentWidth - 40) {
        legendX = padding + 8;
        y += LEGEND_FONT_SIZE + 6;
      }
    }
    y += LEGEND_FONT_SIZE + 14;
  }

  const maxBytes = Math.max(...visibleRepos.map((r) => r.totalBytes), 1);
  const fullBarWidth = contentWidth - 16;

  for (const repo of data.repos) {
    // Skip repos that shouldn't be named
    if (!shouldEnumerate(toRepoProps(repo), ctx.repos.rules)) continue;
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

    const langCount = repo.languages.length;
    let langIndex = 0;
    for (const lang of repo.languages) {
      const pct = lang.bytes / repo.totalBytes;
      const width = Math.max(pct * repoBarWidth, 1);
      // Only round outer edges
      const rx =
        langCount === 1
          ? BAR_RX
          : langIndex === 0
            ? BAR_RX
            : langIndex === langCount - 1
              ? BAR_RX
              : 0;

      elements.push(
        rect(xOffset, y, width, BAR_HEIGHT, {
          fill: lang.colour,
          rx,
        }),
      );
      xOffset += width;
      langIndex++;
    }

    // Advance past the bar
    y += BAR_HEIGHT + BAR_BELOW_GAP + REPO_NAME_FONT_SIZE;
  }

  const totalHeight = y + padding - contentY;

  return { height: totalHeight, elements };
}

/** Convert a LinesData repo to RepoProperties for filter matching. */
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
