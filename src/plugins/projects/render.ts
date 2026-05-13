/**
 * Projects plugin — renderer.
 *
 * Renders GitHub Projects v2 boards as a list with item counts.
 */

import { text } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { ProjectsData } from "./source.ts";
import { emptySection } from "../empty.ts";
import { sectionHeader } from "../../render/svg/header.ts";

/**
 * Render projects section.
 */
export function renderProjects(
  data: ProjectsData,
  config: { descriptions?: boolean },
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;
  const showDescriptions = config.descriptions ?? false;

  if (data.projects.length === 0) {
    return emptySection("Projects", "No projects found", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems } = sectionHeader(
    `Projects (${String(data.totalProjects)})`,
    ctx,
    {
      pluginId: "projects",
    },
  );
  elements.push(...headerElems);

  let y = 32;
  const nameFont = 12;
  const descFont = 10;
  const countFont = 10;

  for (const project of data.projects) {
    // Project name (left) and item count (right)
    const nameText = truncateText(
      project.title,
      ctx.contentWidth - 80,
      nameFont,
      ctx.measure,
    );
    elements.push(
      text(padding + 8, y + nameFont - 2, nameText, {
        fill: colours.text,
        "font-size": nameFont,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    const countText = `${String(project.itemCount)} items`;
    const countWidth = ctx.measure.textWidth(countText, countFont);
    elements.push(
      text(padding + ctx.contentWidth - countWidth, y + countFont, countText, {
        fill: colours.textTertiary,
        "font-size": countFont,
        "font-family": fontStack,
      }),
    );
    y += nameFont + 3;

    // Description (if present and enabled)
    if (showDescriptions && project.description.length > 0) {
      const desc = truncateText(
        project.description,
        ctx.contentWidth - 16,
        descFont,
        ctx.measure,
      );
      elements.push(
        text(padding + 8, y + descFont, desc, {
          fill: colours.textSecondary,
          "font-size": descFont,
          "font-family": fontStack,
        }),
      );
      y += descFont + 4;
    }

    // Mini progress bar showing item count relative to largest project
    y += 2;
  }

  return { height: y + padding, elements };
}
