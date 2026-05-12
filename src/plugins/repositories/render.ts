/**
 * Repositories plugin — renderer.
 *
 * Renders featured/pinned repository cards with description,
 * language, stars, forks, issues, and PRs.
 */

import { g, rect, text, circle } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { RepositoriesData } from "./source.ts";

/**
 * Format a large number compactly (e.g. 1234 → "1.2k").
 */
function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/**
 * Render repositories as card-style rows.
 */
export function renderRepositories(
  data: RepositoriesData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const { icons } = ctx;

  if (data.list.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Section title
  const titleY = 14;
  elements.push(
    text(padding, titleY, "Featured repositories", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let yCursor = titleY + 16;
  const cardPadding = 12;
  const cardWidth = ctx.contentWidth;

  // We pre-compute card heights by building cards into a temporary array,
  // then assembling the final element list.
  const cards: {
    bg: import("../../render/svg/builder.ts").SvgElement;
    contents: import("../../render/svg/builder.ts").SvgElement[];
  }[] = [];

  for (const repo of data.list) {
    const cardElements: import("../../render/svg/builder.ts").SvgElement[] = [];

    // Placeholder background rect — height patched below
    const bgRect = rect(padding, yCursor, cardWidth, 0, {
      fill: colours.background === "#0d1117" ? "#161b22" : colours.border,
      rx: 6,
      "data-name": repo.nameWithOwner,
    });

    let innerY = yCursor + cardPadding;

    // Repo icon + name row
    const repoIconChildren: import("../../render/svg/builder.ts").SvgElement[] =
      [];
    if (repo.isFork) {
      repoIconChildren.push({
        tag: "path",
        attrs: { d: icons.get("repo-forked"), fill: colours.textTertiary },
      });
    } else {
      repoIconChildren.push({
        tag: "path",
        attrs: { d: icons.get("repo"), fill: colours.textTertiary },
      });
    }

    cardElements.push(
      g(
        {
          transform: `translate(${String(padding + cardPadding)},${String(innerY)})`,
        },
        {
          tag: "svg",
          attrs: {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 16 16",
            width: 14,
            height: 14,
          },
          children: repoIconChildren,
        },
        text(20, 12, repo.nameWithOwner, {
          fill: colours.text,
          "font-size": 13,
          "font-weight": 600,
          "font-family": fontStack,
        }),
      ),
    );
    innerY += 20;

    // Description
    if (repo.description) {
      const maxDescWidth = cardWidth - cardPadding * 2;
      const truncatedDesc = truncateText(
        repo.description,
        maxDescWidth,
        12,
        ctx.measure,
      );
      cardElements.push(
        text(padding + cardPadding, innerY + 12, truncatedDesc, {
          fill: colours.textSecondary,
          "font-size": 12,
          "font-family": fontStack,
        }),
      );
      innerY += 20;
    }

    // Info row: language, stars, forks
    const infoY = innerY + 4;
    const infoItems: import("../../render/svg/builder.ts").SvgElement[] = [];
    let infoX = padding + cardPadding;

    // Primary language
    if (repo.primaryLanguage) {
      infoItems.push(
        circle(infoX + 5, infoY + 5, 5, { fill: repo.primaryLanguage.color }),
      );
      infoItems.push(
        text(infoX + 14, infoY + 9, repo.primaryLanguage.name, {
          fill: colours.textSecondary,
          "font-size": 11,
          "font-family": fontStack,
        }),
      );
      infoX += 14 + ctx.measure.textWidth(repo.primaryLanguage.name, 11) + 16;
    }

    // Stars
    const starsText = `★ ${formatCount(repo.stargazerCount)}`;
    infoItems.push(
      text(infoX, infoY + 9, starsText, {
        fill: colours.textTertiary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );
    infoX += ctx.measure.textWidth(starsText, 11) + 12;

    // Forks
    const forksText = `⑂ ${formatCount(repo.forkCount)}`;
    infoItems.push(
      text(infoX, infoY + 9, forksText, {
        fill: colours.textTertiary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    cardElements.push(g({}, ...infoItems));

    innerY = infoY + 18;
    const cardHeight = innerY - yCursor + cardPadding;

    // Patch background rect height
    bgRect.attrs.height = cardHeight;

    cards.push({ bg: bgRect, contents: cardElements });
    yCursor = innerY + 8;
  }

  // Assemble: backgrounds first (behind), then contents
  for (const card of cards) {
    elements.push(card.bg);
  }
  for (const card of cards) {
    elements.push(...card.contents);
  }

  return { height: yCursor + padding, elements };
}
