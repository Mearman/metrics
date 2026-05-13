/**
 * Licences plugin — renderer.
 *
 * Renders licence breakdown as a horizontal bar chart with
 * colour-coded licence categories.
 */

import * as z from "zod";
import { text, rect } from "../../render/svg/builder.ts";
import { truncateText } from "../../render/layout/text.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import { LicencesConfig } from "./source.ts";
import type { LicencesData } from "./source.ts";
import { emptySection } from "../empty.ts";

/** Colour map for common licence SPDX IDs */
const licenceColours: Record<string, string> = {
  MIT: "#6e40c9",
  "Apache-2.0": "#e34c26",
  "GPL-3.0": "#cc0162",
  "GPL-2.0": "#cc0162",
  "BSD-3-Clause": "#f1e05a",
  "BSD-2-Clause": "#f1e05a",
  ISC: "#563d7c",
  "0BSD": "#563d7c",
  Unlicense: "#8b949e",
  NOASSERTION: "#6e7681",
};

/**
 * Render licence breakdown as a bar chart.
 */
export function renderLicences(
  data: LicencesData,
  config: z.input<typeof LicencesConfig>,
  ctx: RenderContext,
): RenderResult {
  const { colours, fontStack, sectionPadding: padding } = ctx.theme;

  if (data.licences.length === 0 && data.unlicensed === 0) {
    return emptySection("Licences", "No licenced repositories found", ctx);
  }

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  elements.push(
    text(padding, 14, "Licences", {
      fill: colours.text,
      "font-size": 14,
      "font-weight": 600,
      "font-family": fontStack,
    }),
  );

  let yCursor = 28;
  const labelWidth = 140;
  const barMaxWidth = ctx.contentWidth - labelWidth - 40;

  // Combine licences with unlicensed count
  const entries: { label: string; count: number; colour: string }[] = [];

  for (const licence of data.licences) {
    entries.push({
      label: licence.spdxId,
      count: licence.count,
      colour: licenceColours[licence.spdxId] ?? "#58a6ff",
    });
  }

  if (data.unlicensed > 0) {
    entries.push({
      label: "No licence",
      count: data.unlicensed,
      colour: "#30363d",
    });
  }

  const maxCount = Math.max(...entries.map((e) => e.count), 1);

  for (const entry of entries) {
    const label = truncateText(entry.label, labelWidth - 8, 11, ctx.measure);
    elements.push(
      text(padding, yCursor, label, {
        fill: colours.textSecondary,
        "font-size": 11,
        "font-family": fontStack,
      }),
    );

    const barWidth = (entry.count / maxCount) * barMaxWidth;
    elements.push(
      rect(padding + labelWidth, yCursor - 8, Math.max(barWidth, 1), 12, {
        fill: entry.colour,
        rx: 3,
        opacity: 0.8,
      }),
    );

    elements.push(
      text(padding + labelWidth + barWidth + 6, yCursor, String(entry.count), {
        fill: colours.textTertiary,
        "font-size": 10,
        "font-family": fontStack,
      }),
    );

    yCursor += 18;
  }

  return { height: yCursor + padding, elements };
}
