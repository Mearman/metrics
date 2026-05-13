/**
 * People plugin — renderer.
 *
 * Renders followers/following as an avatar grid using <image> elements.
 */

import { text, image, g } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { PeopleData, PeopleConfig } from "./source.ts";
import { emptySection } from "../empty.ts";

/**
 * Render people sections as avatar grids.
 */
export function renderPeople(
  data: PeopleData,
  config: PeopleConfig,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.sections.length === 0) {
    return emptySection("People", "No followers or following yet", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];
  const avatarSize = config.size;
  const gap = 4;
  const step = avatarSize + gap;
  const cols = Math.floor(ctx.contentWidth / step);

  let yCursor = 0;

  for (const section of data.sections) {
    const label = section.type === "followers" ? "Followers" : "Following";

    const title = `${label} (${String(section.totalCount)})`;

    elements.push(
      text(padding, yCursor + 14, title, {
        fill: colours.text,
        "font-size": 14,
        "font-weight": 600,
        "font-family": fontStack,
      }),
    );

    yCursor += 24;

    // Avatar grid
    const avatarElements: import("../../render/svg/builder.ts").SvgElement[] =
      [];

    let i = 0;
    for (const person of section.people) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * step;
      const y = row * step;

      avatarElements.push(
        image(x, y, avatarSize, avatarSize, person.avatarUrl),
      );
      i++;
    }

    elements.push(
      g(
        { transform: `translate(${String(padding)},${String(yCursor)})` },
        ...avatarElements,
      ),
    );

    const rows = Math.ceil(section.people.length / cols);
    yCursor += rows * step + 8;
  }

  return { height: yCursor + padding, elements };
}
