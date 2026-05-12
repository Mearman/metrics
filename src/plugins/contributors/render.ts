import * as z from "zod";
/**
 * Contributors plugin — renderer.
 *
 * Renders contributor avatar grids grouped by repository.
 */

import { text, image } from "../../render/svg/builder.ts";
import { shouldEnumerate } from "../../repos/filter.ts";
import type { RepoProperties } from "../../repos/filter.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { ContributorsConfig } from "./source.ts";
import type { ContributorsData } from "./source.ts";

/**
 * Render contributor avatar grids per repository.
 */
export function renderContributors(
  data: ContributorsData,
  config: z.input<typeof ContributorsConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Contributors", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  if (data.repos.length === 0) {
    elements.push(
      text(padding, 34, "No contributor data", {
        fill: colours.textTertiary,
        "font-size": 12,
        "font-family": fontStack,
      }),
    );
    return { height: 50, elements };
  }

  let y = 34;
  const avatarSize = 24;
  const avatarSpacing = 4;
  const avatarsPerRow = Math.floor(
    ctx.contentWidth / (avatarSize + avatarSpacing),
  );

  for (const repo of data.repos) {
    // Skip repos that shouldn't be named
    if (!shouldEnumerate(toRepoProps(repo), ctx.repos.rules)) continue;

    // Repo name
    elements.push(
      text(padding, y + 12, repo.repository, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );
    y += 18;

    // Avatar grid
    let col = 0;
    for (const contributor of repo.contributors) {
      const x = padding + col * (avatarSize + avatarSpacing);
      elements.push(image(x, y, avatarSize, avatarSize, contributor.avatarUrl));
      col++;
      if (col >= avatarsPerRow) {
        col = 0;
        y += avatarSize + avatarSpacing;
      }
    }
    if (col !== 0) y += avatarSize + avatarSpacing;
    y += 8;
  }

  return { height: y + padding, elements };
}

/** Convert a ContributorsData repo to RepoProperties for filter matching. */
function toRepoProps(repo: {
  repository: string;
  isPrivate: boolean;
}): RepoProperties {
  const slashIndex = repo.repository.indexOf("/");
  return {
    name: repo.repository,
    isPrivate: repo.isPrivate,
    owner:
      slashIndex >= 0 ? repo.repository.slice(0, slashIndex) : repo.repository,
    topics: [],
    language: null,
  };
}
