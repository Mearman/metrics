/**
 * Followup plugin — renderer.
 *
 * Renders issue and PR status as progress bars.
 */

import { text, rect } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { FollowupData } from "./source.ts";

/**
 * Render follow-up sections with progress bars.
 */
export function renderFollowup(
  data: FollowupData,
  _config: Record<string, unknown>,
  ctx: RenderContext,
): RenderResult {
  void _config;
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.sections.length === 0) {
    return { height: 0, elements: [] };
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Follow-up", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let yCursor = 32;

  for (const section of data.sections) {
    // Section subtitle
    elements.push(
      text(padding, yCursor, section.title, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );
    yCursor += 18;

    const barWidth = ctx.contentWidth;
    const barHeight = 8;

    // Issues progress bar
    const totalIssues = section.issues.open + section.issues.closed;
    if (totalIssues > 0) {
      const closedRatio = section.issues.closed / totalIssues;
      const closedWidth = barWidth * closedRatio;

      elements.push(
        rect(padding, yCursor, barWidth, barHeight, {
          fill: colours.border,
          rx: 4,
        }),
      );
      elements.push(
        rect(padding, yCursor, closedWidth, barHeight, {
          fill: "#3fb950",
          rx: 4,
        }),
      );
      yCursor += barHeight + 6;

      elements.push(
        text(
          padding,
          yCursor,
          `${String(section.issues.open)} open · ${String(section.issues.closed)} closed`,
          {
            fill: colours.textTertiary,
            "font-size": 10,
            "font-family": fontStack,
          },
        ),
      );
      yCursor += 18;
    }

    // PRs progress bar
    const totalPRs =
      section.pullRequests.open +
      section.pullRequests.merged +
      section.pullRequests.closed;
    if (totalPRs > 0) {
      const mergedRatio = section.pullRequests.merged / totalPRs;
      const closedRatio = section.pullRequests.closed / totalPRs;
      const mergedWidth = barWidth * mergedRatio;
      const closedWidth = barWidth * closedRatio;

      elements.push(
        rect(padding, yCursor, barWidth, barHeight, {
          fill: colours.border,
          rx: 4,
        }),
      );
      elements.push(
        rect(padding, yCursor, mergedWidth, barHeight, {
          fill: "#a371f7",
          rx: 4,
        }),
      );
      elements.push(
        rect(padding + mergedWidth, yCursor, closedWidth, barHeight, {
          fill: "#f85149",
          rx: 4,
        }),
      );
      yCursor += barHeight + 6;

      elements.push(
        text(
          padding,
          yCursor,
          `${String(section.pullRequests.open)} open · ${String(section.pullRequests.merged)} merged · ${String(section.pullRequests.closed)} closed`,
          {
            fill: colours.textTertiary,
            "font-size": 10,
            "font-family": fontStack,
          },
        ),
      );
      yCursor += 20;
    }

    yCursor += 4;
  }

  return { height: yCursor + padding, elements };
}
