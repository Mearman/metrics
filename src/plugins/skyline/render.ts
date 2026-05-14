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
// Month/quarter boundary detection
// ---------------------------------------------------------------------------

/** A gap between month blocks, drawn as a road on the ground plane. */
interface Road {
  /** Effective column index where the road starts */
  effectiveCol: number;
  /** Width of the road in cells */
  width: number;
  /** Whether this is a quarter boundary (highway) or month boundary (road) */
  quarter: boolean;
}

/**
 * Analyse the week dates to find month and quarter boundaries.
 * Returns a per-column offset (how many extra cells to add before
 * each column) and a list of road descriptors for drawing.
 */
function computeRoads(
  data: IsocalendarData,
  monthGap: number,
  quarterGap: number,
): { colOffset: number[]; roads: Road[] } {
  const totalWeeks = data.weeks.length;
  const colOffset = new Array<number>(totalWeeks).fill(0);
  const roads: Road[] = [];
  let accum = 0;

  for (let col = 1; col < totalWeeks; col++) {
    const week = data.weeks[col];
    if (week === undefined) continue;
    // Use the first day of the week to determine which month it belongs to
    const firstDay = week.contributionDays[0];
    if (firstDay === undefined) continue;

    const prevWeek = data.weeks[col - 1];
    if (prevWeek === undefined) continue;
    const prevLastDay =
      prevWeek.contributionDays[prevWeek.contributionDays.length - 1];
    if (prevLastDay === undefined) continue;

    const prevMonth = prevLastDay.date.slice(5, 7);
    const currMonth = firstDay.date.slice(5, 7);

    if (prevMonth !== currMonth) {
      const prevQ = Math.ceil(parseInt(prevMonth) / 3);
      const currQ = Math.ceil(parseInt(currMonth) / 3);
      const isQuarter = prevQ !== currQ;
      const gap = isQuarter ? quarterGap : monthGap;

      accum += gap;
      roads.push({
        effectiveCol: col + accum - gap,
        width: gap,
        quarter: isQuarter,
      });
    }
    colOffset[col] = accum;
  }

  return { colOffset, roads };
}

// ---------------------------------------------------------------------------
// Building face paths
// ---------------------------------------------------------------------------

/**
 * Map logical column index to effective column (with road gaps).
 * Returns a function that maps (col, row) → screen coordinates.
 */
function makeIsoMap(
  colOffset: number[],
  cellW: number,
  cellH: number,
): (col: number, row: number) => { sx: number; sy: number } {
  return (col: number, row: number) => ({
    sx: (col + (colOffset[col] ?? 0) - row) * COS30 * cellW,
    sy: (col + (colOffset[col] ?? 0) + row) * SIN30 * cellH,
  });
}

function topFacePoints(
  map: (col: number, row: number) => { sx: number; sy: number },
  col: number,
  row: number,
  height: number,
  cellW: number,
  cellH: number,
): string {
  const { sx: ox, sy: baseY } = map(col, row);
  const oy = baseY - height;
  const front = `${r(ox)},${r(oy + SIN30 * cellH)}`;
  const right = `${r(ox + COS30 * cellW)},${r(oy)}`;
  const back = `${r(ox)},${r(oy - SIN30 * cellH)}`;
  const left = `${r(ox - COS30 * cellW)},${r(oy)}`;
  return `M${left} L${back} L${right} L${front} Z`;
}

function rightFacePoints(
  map: (col: number, row: number) => { sx: number; sy: number },
  col: number,
  row: number,
  height: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
): string {
  const { sx: ox, sy: baseY } = map(col, row);
  const oy = baseY - height;
  const groundOy = baseY + maxHeight;
  const topRight = `${r(ox + COS30 * cellW)},${r(oy)}`;
  const topFront = `${r(ox)},${r(oy + SIN30 * cellH)}`;
  const groundFront = `${r(ox)},${r(groundOy + SIN30 * cellH)}`;
  const groundRight = `${r(ox + COS30 * cellW)},${r(groundOy)}`;
  return `M${topRight} L${topFront} L${groundFront} L${groundRight} Z`;
}

function leftFacePoints(
  map: (col: number, row: number) => { sx: number; sy: number },
  col: number,
  row: number,
  height: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
): string {
  const { sx: ox, sy: baseY } = map(col, row);
  const oy = baseY - height;
  const groundOy = baseY + maxHeight;
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
  lastEffectiveCol: number,
  lastRow: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
  strokeColour: string,
): SvgElement[] {
  const elements: SvgElement[] = [];
  const attrs = { stroke: strokeColour, "stroke-width": 0.25, fill: "none" };

  for (let col = 0; col <= lastEffectiveCol; col += 4) {
    const startX = (col - 0) * COS30 * cellW;
    const startY = (col + 0) * SIN30 * cellH + maxHeight;
    const endX = (col - lastRow) * COS30 * cellW;
    const endY = (col + lastRow) * SIN30 * cellH + maxHeight;
    elements.push(
      path(`M${r(startX)},${r(startY)} L${r(endX)},${r(endY)}`, attrs),
    );
  }

  for (let row = 0; row <= lastRow; row += 2) {
    const startX = (0 - row) * COS30 * cellW;
    const startY = (0 + row) * SIN30 * cellH + maxHeight;
    const endX = (lastEffectiveCol - row) * COS30 * cellW;
    const endY = (lastEffectiveCol + row) * SIN30 * cellH + maxHeight;
    elements.push(
      path(`M${r(startX)},${r(startY)} L${r(endX)},${r(endY)}`, attrs),
    );
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Road/highway rendering
// ---------------------------------------------------------------------------

function roadPaths(
  roads: Road[],
  lastRow: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
  roadColour: string,
  highwayColour: string,
): SvgElement[] {
  const elements: SvgElement[] = [];

  for (const road of roads) {
    const col = road.effectiveCol;
    // Road is a strip between col and col + road.width
    // Draw as a parallelogram from row=0 to row=lastRow at ground level
    const midCol = col + road.width / 2;
    const colour = road.quarter ? highwayColour : roadColour;

    // Top edge (back-left to back-right)
    const tlx = (col - 0) * COS30 * cellW;
    const tly = (col + 0) * SIN30 * cellH + maxHeight;
    const trx = (midCol - 0) * COS30 * cellW;
    const try_ = (midCol + 0) * SIN30 * cellH + maxHeight;

    // Bottom edge (front-left to front-right)
    const blx = (col - lastRow) * COS30 * cellW;
    const bly = (col + lastRow) * SIN30 * cellH + maxHeight;
    const brx = (midCol - lastRow) * COS30 * cellW;
    const bry = (midCol + lastRow) * SIN30 * cellH + maxHeight;

    elements.push(
      path(
        `M${r(tlx)},${r(tly)} L${r(trx)},${r(try_)} L${r(brx)},${r(bry)} L${r(blx)},${r(bly)} Z`,
        {
          fill: colour,
          stroke: colour,
          "stroke-width": road.quarter ? 0.5 : 0.25,
        },
      ),
    );

    // Dashed centre line for highways
    if (road.quarter) {
      const cx1 = (col + road.width * 0.25 - 0) * COS30 * cellW;
      const cy1 = (col + road.width * 0.25 + 0) * SIN30 * cellH + maxHeight;
      const cx2 = (col + road.width * 0.25 - lastRow) * COS30 * cellW;
      const cy2 =
        (col + road.width * 0.25 + lastRow) * SIN30 * cellH + maxHeight;
      elements.push(
        path(`M${r(cx1)},${r(cy1)} L${r(cx2)},${r(cy2)}`, {
          stroke: darken(highwayColour, 0.3),
          "stroke-width": 0.5,
          "stroke-dasharray": "3 2",
          fill: "none",
        }),
      );
    }
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Building shadows
// ---------------------------------------------------------------------------

function buildingShadows(
  buildings: Building[],
  colOffset: number[],
  maxCount: number,
  maxHeight: number,
  cellW: number,
  cellH: number,
  shadowColour: string,
): SvgElement[] {
  const elements: SvgElement[] = [];
  const shadowDx = 2;
  const shadowDy = 1;
  const map = makeIsoMap(colOffset, cellW, cellH);

  for (const building of buildings) {
    if (building.count === 0) continue;
    const height = Math.max((building.count / maxCount) * maxHeight, 3);
    const shadowLen = (height / maxHeight) * 6;
    const { col, row } = building;
    const { sx: ox, sy: baseY } = map(col, row);
    const groundOy = baseY + maxHeight;

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
  config: {
    max_height?: number;
    colour_scheme?: string;
    roads?: boolean;
  },
  ctx: RenderContext,
): RenderResult {
  const { colours } = ctx.theme;
  const maxHeight = config.max_height ?? 100;
  const colourScheme = config.colour_scheme ?? "contributions";
  const enableRoads = config.roads ?? false;
  const cal = calendarColours(ctx.theme);

  const elements: SvgElement[] = [];

  const { elements: headerElems, contentY } = sectionHeader("Skyline", ctx, {
    pluginId: "skyline",
  });
  elements.push(...headerElems);

  const totalWeeks = data.weeks.length;
  const totalRows = 7;
  const targetWidth = ctx.contentWidth;

  // Compute road gaps if enabled
  const monthGap = 0.8; // cells
  const quarterGap = 1.5; // cells
  const { colOffset, roads } = enableRoads
    ? computeRoads(data, monthGap, quarterGap)
    : { colOffset: new Array<number>(totalWeeks).fill(0), roads: [] };

  // Effective last column (with gaps accumulated)
  const lastCol = totalWeeks - 1;
  const lastRow = totalRows - 1;
  const effectiveLastCol = lastCol + (colOffset[lastCol] ?? 0);

  // Compute cell size to fit the effective width
  const cellW = Math.max(
    Math.floor(targetWidth / ((effectiveLastCol + totalRows) * COS30)),
    3,
  );
  const cellH = cellW * SIN30;

  // Iso coordinate map
  const iso = makeIsoMap(colOffset, cellW, cellH);

  // Find maximum contribution count
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

  // Ground-plane corners (using effective coordinates)
  const dcolX = COS30 * cellW;
  const dcolY = SIN30 * cellH;
  const drowX = -COS30 * cellW;
  const drowY = SIN30 * cellH;

  const gpBack = { x: 0, y: maxHeight };
  const gpRight = {
    x: effectiveLastCol * dcolX,
    y: effectiveLastCol * dcolY + maxHeight,
  };
  const gpFront = {
    x: effectiveLastCol * dcolX + lastRow * drowX,
    y: effectiveLastCol * dcolY + lastRow * drowY + maxHeight,
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

  // Collect and sort buildings
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

  // Grid lines
  buildingElements.push(
    ...gridLines(
      effectiveLastCol,
      lastRow,
      maxHeight,
      cellW,
      cellH,
      darken(colours.border, 0.3),
    ),
  );

  // Roads/highways
  if (roads.length > 0) {
    buildingElements.push(
      ...roadPaths(
        roads,
        lastRow,
        maxHeight,
        cellW,
        cellH,
        darken(cal.L0, 0.15),
        darken(cal.L0, 0.3),
      ),
    );
  }

  // Shadows
  buildingElements.push(
    ...buildingShadows(
      buildings,
      colOffset,
      maxCount,
      maxHeight,
      cellW,
      cellH,
      darken(cal.L0, 0.5),
    ),
  );

  // Render building faces
  const rawFaces: SvgElement[] = [];

  for (const building of buildings) {
    const { col, row, count } = building;
    if (count === 0) continue;

    const level = contributionLevel(count);
    const colour = resolveColour(colourScheme, level, cal);
    const height = Math.max((count / maxCount) * maxHeight, 3);
    const { sx: ox, sy: baseY } = iso(col, row);
    const groundOy = baseY + maxHeight;

    rawFaces.push(
      path(topFacePoints(iso, col, row, height, cellW, cellH), {
        fill: lighten(colour, 0.3),
        stroke: darken(colour, 0.3),
        "stroke-width": 0.5,
      }),
    );

    rawFaces.push(
      path(rightFacePoints(iso, col, row, height, maxHeight, cellW, cellH), {
        fill: colour,
        stroke: darken(colour, 0.3),
        "stroke-width": 0.5,
      }),
    );

    rawFaces.push(
      path(leftFacePoints(iso, col, row, height, maxHeight, cellW, cellH), {
        fill: darken(colour, 0.2),
        stroke: darken(colour, 0.4),
        "stroke-width": 0.5,
      }),
    );

    // Ambient occlusion lines
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
