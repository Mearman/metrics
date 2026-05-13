import * as z from "zod";
/**
 * Followup plugin — renderer.
 *
 * Renders issue and PR status as progress bars.
 */

import { text, rect, g } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { FollowupConfig } from "./source.ts";
import type { FollowupData } from "./source.ts";
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

/** Vertical gap between a bar bottom and the label baseline. */
const BAR_LABEL_GAP = 6;

/** Font size for stat labels below bars. */
const LABEL_FONT_SIZE = 10;

/** Font size for section subtitles. */
const SUBTITLE_FONT_SIZE = 11;

/** Line spacing after a label before the next element. */
const LINE_HEIGHT = 14;

/**
 * Render follow-up sections with progress bars.
 */
export function renderFollowup(
  data: FollowupData,
  config: z.input<typeof FollowupConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.sections.length === 0) {
    return emptySection(
      "Follow-up",
      "No open issues or pull requests found",
      ctx,
    );
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems } = sectionHeader("Follow-up", ctx, {
    pluginId: "followup",
  });
  elements.push(...headerElems);

  let yCursor = 32;
  const barWidth = ctx.contentWidth;
  const barHeight = 8;

  for (const section of data.sections) {
    // Section subtitle
    elements.push(
      text(padding, yCursor, section.title, {
        fill: colours.textSecondary,
        "font-size": SUBTITLE_FONT_SIZE,
        "font-family": fontStack,
      }),
    );
    yCursor += LINE_HEIGHT + SUBTITLE_FONT_SIZE - LABEL_FONT_SIZE;

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

      // Label baseline sits below the bar with clearance for the
      // text ascent (text y is baseline, text extends upward).
      yCursor += barHeight + BAR_LABEL_GAP + LABEL_FONT_SIZE;
      elements.push(
        text(
          padding,
          yCursor,
          `${String(section.issues.open)} open · ${String(section.issues.closed)} closed`,
          {
            fill: colours.textTertiary,
            "font-size": LABEL_FONT_SIZE,
            "font-family": fontStack,
          },
        ),
      );
      yCursor += LINE_HEIGHT;
    }

    // PRs progress bar — uses clipPath to give segments the
    // track's rounded shape without gaps between segments.
    const totalPRs =
      section.pullRequests.open +
      section.pullRequests.merged +
      section.pullRequests.closed;
    if (totalPRs > 0) {
      const mergedRatio = section.pullRequests.merged / totalPRs;
      const closedRatio = section.pullRequests.closed / totalPRs;
      const mergedWidth = barWidth * mergedRatio;
      const closedWidth = barWidth * closedRatio;

      const clipId = `pr-clip-${String(yCursor)}`;

      elements.push(
        g(
          { transform: `translate(0,${String(yCursor)})` },
          {
            tag: "defs",
            attrs: {},
            children: [
              {
                tag: "clipPath",
                attrs: { id: clipId },
                children: [rect(padding, 0, barWidth, barHeight, { rx: 4 })],
              },
            ],
          },
          rect(padding, 0, barWidth, barHeight, {
            fill: colours.border,
            rx: 4,
          }),
          g(
            { "clip-path": `url(#${clipId})` },
            rect(padding, 0, mergedWidth, barHeight, {
              fill: "#a371f7",
            }),
            rect(padding + mergedWidth - 1, 0, closedWidth + 1, barHeight, {
              fill: "#f85149",
            }),
          ),
        ),
      );

      // Label baseline sits below the bar with clearance.
      yCursor += barHeight + BAR_LABEL_GAP + LABEL_FONT_SIZE;
      elements.push(
        text(
          padding,
          yCursor,
          `${String(section.pullRequests.open)} open · ${String(section.pullRequests.merged)} merged · ${String(section.pullRequests.closed)} closed`,
          {
            fill: colours.textTertiary,
            "font-size": LABEL_FONT_SIZE,
            "font-family": fontStack,
          },
        ),
      );
      yCursor += LINE_HEIGHT;
    }

    yCursor += 4;
  }

  return { height: yCursor + padding, elements };
}
