/**
 * Lines of Code plugin — renderer.
 *
 * Renders per-repo line counts with proportional stacked bars
 * coloured by language.
 */

import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import { shouldEnumerate } from "../../repos/filter.ts";
import type { RepoProperties } from "../../repos/filter.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { LocData } from "./source.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatLines(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
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

const TEXT_TO_BAR_GAP = 4;
const BAR_TO_TEXT_GAP = 6;

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function renderLoc(
  data: LocData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const contentWidth = ctx.contentWidth;

  if (data.repos.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, TITLE_Y, `Lines of code (${formatLines(data.totalLines)})`, {
      fill: colours.text,
      "font-size": TITLE_FONT_SIZE,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  const maxLines = Math.max(...data.repos.map((r) => r.totalLines));
  const fullBarWidth = contentWidth - 16;

  let y = TITLE_Y + 22;

  for (const repo of data.repos) {
    // Skip repos that shouldn't be named
    if (!shouldEnumerate(toRepoProps(repo), ctx.repos.rules)) continue;

    // Repo name
    const displayName = truncateText(
      repo.name,
      contentWidth - 80,
      REPO_NAME_FONT_SIZE,
      ctx.measure,
    );
    elements.push(
      text(padding + 8, y + REPO_NAME_FONT_SIZE - 2, displayName, {
        fill: colours.text,
        "font-size": REPO_NAME_FONT_SIZE,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    // Size label (right-aligned)
    const sizeText = formatLines(repo.totalLines);
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

    y += REPO_NAME_FONT_SIZE + TEXT_TO_BAR_GAP;

    // Stacked bar — proportional to the largest repo
    const repoBarWidth = (repo.totalLines / maxLines) * fullBarWidth;
    let xOffset = padding + 8;

    for (const lang of repo.languages) {
      const pct = lang.lines / repo.totalLines;
      const width = Math.max(pct * repoBarWidth, 1);

      elements.push(
        rect(xOffset, y, width, BAR_HEIGHT, {
          fill: lang.colour,
          rx: BAR_RX,
        }),
      );
      xOffset += width;
    }

    y += BAR_HEIGHT + BAR_TO_TEXT_GAP + REPO_NAME_FONT_SIZE;
  }

  const totalHeight = y + padding - TITLE_Y;

  return { height: totalHeight, elements };
}

/** Convert a LocData repo to RepoProperties for filter matching. */
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
