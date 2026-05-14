/**
 * Skyline plugin — isometric 3D renderer.
 *
 * Renders the contribution calendar as an isometric cityscape.
 * Each day's contributions become a building column; height is
 * proportional to contribution count. Three visible faces (top,
 * left, right) are drawn with lighting to create depth.
 *
 * Buildings are rendered back-to-front (far weeks first, bottom
 * days first) so nearer buildings correctly overlap farther ones.
 *
 * Pure SVG — no WebGL, no foreignObject, no Puppeteer.
 */

import { g, path } from "../../render/svg/builder.ts";
import type { SvgElement } from "../../render/svg/builder.ts";
import type { RenderResult, RenderContext } from "../types.ts";
import type { IsocalendarData } from "../isocalendar/source.ts";
import { sectionHeader } from "../../render/svg/header.ts";
import { lighten, darken, calendarColours } from "../../util/colour.ts";
import type { CalendarLevel } from "../../util/colour.ts";

// ---------------------------------------------------------------------------
// Isometric projection constants
// ---------------------------------------------------------------------------

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = 0.5;

/** Round a coordinate value to 2 decimal places for clean SVG paths. */
function r(n: number): string {
  return n.toFixed(2);
}

// ---------------------------------------------------------------------------
// Colour schemes
// ---------------------------------------------------------------------------

const MONOCHROME: Record<CalendarLevel, string> = {
  L0: "#1a1a2e",
  L1: "#2d3a4a",
  L2: "#3d5a6e",
  L3: "#4d7a92",
  L4: "#5d9ab6",
};

const NEON: Record<CalendarLevel, string> = {
  L0: "#0d0d0d",
  L1: "#ff006e",
  L2: "#fb5607",
  L3: "#ffbe0b",
  L4: "#8338ec",
};

function resolveColour(
  scheme: string,
  level: CalendarLevel,
  cal: Record<CalendarLevel, string>,
): string {
  if (scheme === "monochrome") return MONOCHROME[level];
  if (scheme === "neon") return NEON[level];
  // Default: use calendar contribution colours
  return cal[level];
}

// ---------------------------------------------------------------------------
// Building type
// ---------------------------------------------------------------------------

interface Building {
  col: number;
  row: number;
  count: number;
  drawOrder: number;
}

// ---------------------------------------------------------------------------
// Building face paths
// ---------------------------------------------------------------------------

function topFacePoints(
  col: number,
  row: number,
  height: number,
  cellW: number,
  cellH: number,
): string {
  const ox = (col - row) * COS30 * cellW;
  const oy = (col + row) * SIN30 * cellH - height;
  const front = `${r(ox)},${r(oy + SIN30 * cellH)}`;
  const right = `${r(ox + COS30 * cellW)},${r(oy)}`;
  const back = `${r(ox)},${r(oy - SIN30 * cellH)}`;
  const left = `${r(ox - COS30 * cellW)},${r(oy)}`;
  return `M${left} L${back} L${right} L${front} Z`;
}

function rightFacePoints(
  col: number,
  row: number,
  height: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
): string {
  const ox = (col - row) * COS30 * cellW;
  const oy = (col + row) * SIN30 * cellH - height;
  const groundOy = (col + row) * SIN30 * cellH + maxHeight;
  const topRight = `${r(ox + COS30 * cellW)},${r(oy)}`;
  const topFront = `${r(ox)},${r(oy + SIN30 * cellH)}`;
  const groundFront = `${r(ox)},${r(groundOy + SIN30 * cellH)}`;
  const groundRight = `${r(ox + COS30 * cellW)},${r(groundOy)}`;
  return `M${topRight} L${topFront} L${groundFront} L${groundRight} Z`;
}

function leftFacePoints(
  col: number,
  row: number,
  height: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
): string {
  const ox = (col - row) * COS30 * cellW;
  const oy = (col + row) * SIN30 * cellH - height;
  const groundOy = (col + row) * SIN30 * cellH + maxHeight;
  const topLeft = `${r(ox - COS30 * cellW)},${r(oy)}`;
  const topFront = `${r(ox)},${r(oy + SIN30 * cellH)}`;
  const groundFront = `${r(ox)},${r(groundOy + SIN30 * cellH)}`;
  const groundLeft = `${r(ox - COS30 * cellW)},${r(groundOy)}`;
  return `M${topLeft} L${topFront} L${groundFront} L${groundLeft} Z`;
}

// ---------------------------------------------------------------------------
// Ground-plane grid lines
// ---------------------------------------------------------------------------

function gridLines(
  lastCol: number,
  lastRow: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
  strokeColour: string,
): SvgElement[] {
  const elements: SvgElement[] = [];
  const attrs = {
    stroke: strokeColour,
    "stroke-width": 0.25,
    fill: "none",
  };

  // Column lines (every 4th column to avoid visual noise)
  for (let col = 0; col <= lastCol; col += 4) {
    const startX = (col - 0) * COS30 * cellW;
    const startY = (col + 0) * SIN30 * cellH + maxHeight;
    const endX = (col - lastRow) * COS30 * cellW;
    const endY = (col + lastRow) * SIN30 * cellH + maxHeight;
    elements.push(
      path(`M${r(startX)},${r(startY)} L${r(endX)},${r(endY)}`, attrs),
    );
  }

  // Row lines (every other row)
  for (let row = 0; row <= lastRow; row += 2) {
    const startX = (0 - row) * COS30 * cellW;
    const startY = (0 + row) * SIN30 * cellH + maxHeight;
    const endX = (lastCol - row) * COS30 * cellW;
    const endY = (lastCol + row) * SIN30 * cellH + maxHeight;
    elements.push(
      path(`M${r(startX)},${r(startY)} L${r(endX)},${r(endY)}`, attrs),
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Building shadows
// ---------------------------------------------------------------------------

function buildingShadows(
  buildings: Building[],
  maxCount: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
  shadowColour: string,
): SvgElement[] {
  const elements: SvgElement[] = [];
  const shadowDx = 2;
  const shadowDy = 1;

  for (const building of buildings) {
    if (building.count === 0) continue;
    const height = Math.max((building.count / maxCount) * maxHeight, 3);
    const shadowLen = (height / maxHeight) * 6;
    const { col, row } = building;

    const ox = (col - row) * COS30 * cellW;
    const groundOy = (col + row) * SIN30 * cellH + maxHeight;

    const p1 = `${r(ox - COS30 * cellW)},${r(groundOy)}`;
    const p2 = `${r(ox + COS30 * cellW)},${r(groundOy)}`;
    const p3 = `${r(ox + COS30 * cellW + shadowDx * shadowLen)},${r(groundOy + shadowDy * shadowLen)}`;
    const p4 = `${r(ox - COS30 * cellW + shadowDx * shadowLen)},${r(groundOy + shadowDy * shadowLen)}`;

    elements.push(
      path(`M${p1} L${p2} L${p3} L${p4} Z`, {
        fill: shadowColour,
        opacity: "0.15",
      }),
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Path merging for performance
// ---------------------------------------------------------------------------

interface BucketKey {
  fill: string;
  stroke: string;
  strokeWidth: string;
  opacity: string;
}

function bucketKey(attrs: Record<string, string | number>): BucketKey {
  return {
    fill: String(attrs.fill ?? ""),
    stroke: String(attrs.stroke ?? ""),
    strokeWidth: String(attrs["stroke-width"] ?? ""),
    opacity: String(attrs.opacity ?? ""),
  };
}

function sameKey(a: BucketKey, b: BucketKey): boolean {
  return (
    a.fill === b.fill &&
    a.stroke === b.stroke &&
    a.strokeWidth === b.strokeWidth &&
    a.opacity === b.opacity
  );
}

/**
 * Merge consecutive path elements that share the same visual
 * attributes into compound paths. Reduces element count from
 * potentially 1000+ face paths to a handful of compound paths.
 */
function mergePaths(elements: SvgElement[]): SvgElement[] {
  const result: SvgElement[] = [];
  let currentKey: BucketKey | undefined;
  let currentD = "";

  function flush(): void {
    if (currentKey === undefined || currentD === "") return;
    const attrs: Record<string, string | number> = {};
    if (currentKey.fill) attrs.fill = currentKey.fill;
    if (currentKey.stroke) attrs.stroke = currentKey.stroke;
    if (currentKey.strokeWidth) attrs["stroke-width"] = currentKey.strokeWidth;
    if (currentKey.opacity) attrs.opacity = currentKey.opacity;
    attrs.d = currentD;
    result.push({ tag: "path", attrs });
    currentKey = undefined;
    currentD = "";
  }

  for (const el of elements) {
    if (el.tag !== "path" || el.text) {
      flush();
      result.push(el);
      continue;
    }
    const d = el.attrs.d;
    if (typeof d !== "string") {
      flush();
      result.push(el);
      continue;
    }
    const key = bucketKey(el.attrs);
    if (currentKey !== undefined && sameKey(currentKey, key)) {
      currentD += " " + d;
    } else {
      flush();
      currentKey = key;
      currentD = d;
    }
  }
  flush();

  return result;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function renderSkyline(
  data: IsocalendarData,
  config: { max_height?: number; colour_scheme?: string },
  ctx: RenderContext,
): RenderResult {
  const { colours } = ctx.theme;
  const maxHeight = config.max_height ?? 100;
  const colourScheme = config.colour_scheme ?? "contributions";
  const cal = calendarColours(ctx.theme);

  const elements: SvgElement[] = [];

  const { elements: headerElems, contentY } = sectionHeader("Skyline", ctx, {
    pluginId: "skyline",
  });
  elements.push(...headerElems);

  const totalWeeks = data.weeks.length;
  const totalRows = 7;
  const targetWidth = ctx.contentWidth;
  const cellW = Math.max(
    Math.floor(targetWidth / ((totalWeeks + totalRows) * COS30)),
    3,
  );
  const cellH = cellW * SIN30;

  // Find maximum contribution count for height scaling
  let maxCount = 0;
  for (const week of data.weeks) {
    for (const day of week.contributionDays) {
      if (day.count > maxCount) maxCount = day.count;
    }
  }
  if (maxCount === 0) maxCount = 1;

  function contributionLevel(count: number): CalendarLevel {
    if (count === 0) return "L0";
    if (count <= maxCount * 0.25) return "L1";
    if (count <= maxCount * 0.5) return "L2";
    if (count <= maxCount * 0.75) return "L3";
    return "L4";
  }

  // Grid geometry
  const lastCol = totalWeeks - 1;
  const lastRow = totalRows - 1;
  const dcolX = COS30 * cellW;
  const dcolY = SIN30 * cellH;
  const drowX = -COS30 * cellW;
  const drowY = SIN30 * cellH;

  const gpBack = { x: 0, y: maxHeight };
  const gpRight = { x: lastCol * dcolX, y: lastCol * dcolY + maxHeight };
  const gpFront = {
    x: lastCol * dcolX + lastRow * drowX,
    y: lastCol * dcolY + lastRow * drowY + maxHeight,
  };
  const gpLeft = { x: lastRow * drowX, y: lastRow * drowY + maxHeight };

  const pad = 1;
  const corners = [
    {
      x: gpBack.x - pad * dcolX - pad * drowX,
      y: gpBack.y - pad * dcolY - pad * drowY,
    },
    {
      x: gpRight.x + pad * dcolX - pad * drowX,
      y: gpRight.y + pad * dcolY - pad * drowY,
    },
    {
      x: gpFront.x + pad * dcolX + pad * drowX,
      y: gpFront.y + pad * dcolY + pad * drowY,
    },
    {
      x: gpLeft.x - pad * dcolX + pad * drowX,
      y: gpLeft.y - pad * dcolY + pad * drowY,
    },
  ];

  const cornerXs = corners.map((c) => c.x);
  const cornerYs = corners.map((c) => c.y);
  const sceneMinX = Math.min(...cornerXs);
  const sceneMaxX = Math.max(...cornerXs);
  const sceneActualWidth = sceneMaxX - sceneMinX;
  const sceneLocalTop = -maxHeight - SIN30 * cellH;
  const sceneLocalBottom = Math.max(...cornerYs) + SIN30 * cellH;

  const centreOffset = Math.max(0, (targetWidth - sceneActualWidth) / 2);
  const offsetX = ctx.theme.margin + centreOffset - sceneMinX;

  const topPad = 10;
  const sceneOriginY = contentY + topPad - sceneLocalTop;
  const totalHeight = sceneOriginY + sceneLocalBottom + topPad;

  const buildingElements: SvgElement[] = [];

  // Collect and sort buildings back-to-front
  const buildings: Building[] = [];
  for (let col = 0; col < totalWeeks; col++) {
    const week = data.weeks[col];
    if (week === undefined) continue;
    for (let row = 0; row < week.contributionDays.length; row++) {
      const day = week.contributionDays[row];
      if (day === undefined) continue;
      buildings.push({ col, row, count: day.count, drawOrder: col + row });
    }
  }
  buildings.sort((a, b) => a.drawOrder - b.drawOrder);

  // Ground-plane parallelogram
  const groundPathParts = corners.map(
    (c, i) => `${i === 0 ? "M" : "L"}${r(c.x)},${r(c.y)}`,
  );
  groundPathParts.push("Z");
  buildingElements.push(
    path(groundPathParts.join(" "), {
      fill: cal.L0,
      stroke: colours.border,
      "stroke-width": 0.5,
    }),
  );

  // Faint grid lines within the ground plane
  buildingElements.push(
    ...gridLines(
      lastCol,
      lastRow,
      maxHeight,
      cellW,
      cellH,
      darken(colours.border, 0.3),
    ),
  );

  // Shadows projected onto the ground plane
  buildingElements.push(
    ...buildingShadows(
      buildings,
      maxCount,
      maxHeight,
      cellW,
      cellH,
      darken(cal.L0, 0.5),
    ),
  );

  // Render building faces and ambient occlusion lines
  const rawFaces: SvgElement[] = [];

  for (const building of buildings) {
    const { col, row, count } = building;
    if (count === 0) continue;

    const level = contributionLevel(count);
    const colour = resolveColour(colourScheme, level, cal);
    const height = Math.max((count / maxCount) * maxHeight, 3);
    const groundOy = (col + row) * SIN30 * cellH + maxHeight;
    const ox = (col - row) * COS30 * cellW;

    // Top face (lightest)
    rawFaces.push(
      path(topFacePoints(col, row, height, cellW, cellH), {
        fill: lighten(colour, 0.3),
        stroke: darken(colour, 0.3),
        "stroke-width": 0.5,
      }),
    );

    // Right face (medium)
    rawFaces.push(
      path(rightFacePoints(col, row, height, maxHeight, cellW, cellH), {
        fill: colour,
        stroke: darken(colour, 0.3),
        "stroke-width": 0.5,
      }),
    );

    // Left face (darkest)
    rawFaces.push(
      path(leftFacePoints(col, row, height, maxHeight, cellW, cellH), {
        fill: darken(colour, 0.2),
        stroke: darken(colour, 0.4),
        "stroke-width": 0.5,
      }),
    );

    // Ambient occlusion: thin dark lines at the building base
    const aoStroke = darken(cal.L0, 0.6);
    const baseFront = `${r(ox)},${r(groundOy + SIN30 * cellH)}`;
    const baseRight = `${r(ox + COS30 * cellW)},${r(groundOy)}`;
    const baseLeft = `${r(ox - COS30 * cellW)},${r(groundOy)}`;
    rawFaces.push(
      path(`M${baseFront} L${baseRight}`, {
        stroke: aoStroke,
        "stroke-width": 0.75,
        fill: "none",
        opacity: "0.3",
      }),
    );
    rawFaces.push(
      path(`M${baseFront} L${baseLeft}`, {
        stroke: aoStroke,
        "stroke-width": 0.75,
        fill: "none",
        opacity: "0.3",
      }),
    );
  }

  // Merge same-style paths for performance
  buildingElements.push(...mergePaths(rawFaces));

  elements.push(
    g(
      {
        class: "skyline-scene",
        transform: `translate(${String(offsetX)},${String(sceneOriginY)})`,
      },
      ...buildingElements,
    ),
  );

  return { height: totalHeight, elements };
}
