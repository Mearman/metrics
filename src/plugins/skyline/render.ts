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
import type { RenderResult, RenderContext } from "../types.ts";
import type { IsocalendarData } from "../isocalendar/source.ts";
import { sectionHeader } from "../../render/svg/header.ts";

// ---------------------------------------------------------------------------
// Isometric projection
// ---------------------------------------------------------------------------

/**
 * Project a 3D point to 2D isometric coordinates.
 *
 * Isometric projection: rotate 45° around the vertical axis,
 * then tilt 35.264° (arctan(1/√2)) forward.
 *
 * Simplified 2D projection:
 *   screen_x = (col - row) * cos30 * cellWidth
 *   screen_y = (col + row) * sin30 * cellHeight - height
 *
 * We use cos(30°) ≈ 0.866 and sin(30°) = 0.5 as the standard
 * isometric ratios.
 */
const COS30 = Math.cos(Math.PI / 6); // ≈ 0.866
const SIN30 = 0.5;

/** Round a coordinate value to 2 decimal places for clean SVG paths. */
function r(n: number): string {
  return n.toFixed(2);
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

/** Lighten a hex colour by a fixed amount (0–1). */
function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/** Darken a hex colour by a fixed amount (0–1). */
function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const dr = Math.max(0, Math.round(r * (1 - amount)));
  const dg = Math.max(0, Math.round(g * (1 - amount)));
  const db = Math.max(0, Math.round(b * (1 - amount)));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Building rendering
// ---------------------------------------------------------------------------

/**
 * Compute the four 2D points of a building's top face.
 *
 * The top face is a diamond (parallelogram in isometric projection)
 * at the building's peak height.
 */
function topFacePoints(
  col: number,
  row: number,
  height: number,
  cellW: number,
  cellH: number,
): string {
  const ox = (col - row) * COS30 * cellW;
  const oy = (col + row) * SIN30 * cellH - height;

  // Four corners of the diamond (top face)
  const front = `${r(ox)},${r(oy + SIN30 * cellH)}`;
  const right = `${r(ox + COS30 * cellW)},${r(oy)}`;
  const back = `${r(ox)},${r(oy - SIN30 * cellH)}`;
  const left = `${r(ox - COS30 * cellW)},${r(oy)}`;

  return `M${left} L${back} L${right} L${front} Z`;
}

/**
 * Compute the 2D path of a building's right face.
 *
 * The right face connects the top-right edge down to ground level.
 */
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

  // Top face right edge: right → front
  const topRight = `${r(ox + COS30 * cellW)},${r(oy)}`;
  const topFront = `${r(ox)},${r(oy + SIN30 * cellH)}`;

  // Ground level: same X positions, ground Y
  const groundFront = `${r(ox)},${r(groundOy + SIN30 * cellH)}`;
  const groundRight = `${r(ox + COS30 * cellW)},${r(groundOy)}`;

  return `M${topRight} L${topFront} L${groundFront} L${groundRight} Z`;
}

/**
 * Compute the 2D path of a building's left face.
 *
 * The left face connects the top-left edge down to ground level.
 */
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

  // Top face left edge: left → front
  const topLeft = `${r(ox - COS30 * cellW)},${r(oy)}`;
  const topFront = `${r(ox)},${r(oy + SIN30 * cellH)}`;

  // Ground level
  const groundFront = `${r(ox)},${r(groundOy + SIN30 * cellH)}`;
  const groundLeft = `${r(ox - COS30 * cellW)},${r(groundOy)}`;

  return `M${topLeft} L${topFront} L${groundFront} L${groundLeft} Z`;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the isometric skyline.
 *
 * @param data - Contribution calendar data (same as isocalendar)
 * @param config - Plugin config (max_height, year)
 * @param ctx - Render context (theme, measurements)
 */
export function renderSkyline(
  data: IsocalendarData,
  config: { max_height?: number },
  ctx: RenderContext,
): RenderResult {
  const { colours, sectionPadding: padding } = ctx.theme;
  const maxHeight = config.max_height ?? 100;

  const elements: import("../../render/svg/builder.ts").SvgElement[] = [];

  // Header with icon
  const { elements: headerElems, contentY } = sectionHeader("Skyline", ctx, {
    pluginId: "skyline",
  });
  elements.push(...headerElems);

  // Compute cell sizes to fit within content width
  const totalWeeks = data.weeks.length;
  const totalRows = 7;

  // Each cell occupies cellW in the isometric X direction and
  // cellH in the isometric Y direction. The total projected width
  // is approximately (weeks + rows) * COS30 * cellW. We want this
  // to fit within contentWidth with some padding.
  const targetWidth = ctx.contentWidth;
  // Total projected width ≈ (weeks + rows) * COS30 * cellW
  // Solve for cellW: cellW = targetWidth / ((weeks + rows) * COS30)
  const cellW = Math.max(
    Math.floor(targetWidth / ((totalWeeks + totalRows) * COS30)),
    3,
  );
  const cellH = cellW * SIN30; // Keep aspect ratio

  // Find maximum contribution count for height scaling
  let maxCount = 0;
  for (const week of data.weeks) {
    for (const day of week.contributionDays) {
      if (day.count > maxCount) maxCount = day.count;
    }
  }
  if (maxCount === 0) maxCount = 1; // Avoid division by zero

  // Map contribution levels to colours
  const calendarColours = colours.calendar;

  // Tuple with const assertion — TypeScript knows all 5 elements exist
  const [colour0, colour1, colour2, colour3, colour4] = [
    calendarColours.L0,
    calendarColours.L1,
    calendarColours.L2,
    calendarColours.L3,
    calendarColours.L4,
  ] as const;

  function contributionColour(count: number): string {
    if (count === 0) return colour0;
    if (count <= maxCount * 0.25) return colour1;
    if (count <= maxCount * 0.5) return colour2;
    if (count <= maxCount * 0.75) return colour3;
    return colour4;
  }

  // Compute the bounding box of the isometric scene
  // The scene spans from (0,0) to roughly:
  //   right-most point: (totalWeeks * COS30 * cellW, ...)
  //   bottom-most point: (..., (totalWeeks + totalRows) * SIN30 * cellH)
  const sceneWidth = (totalWeeks + totalRows) * COS30 * cellW;
  const sceneDepth = (totalWeeks + totalRows) * SIN30 * cellH;

  // Offset so the scene is centred in the content area
  const offsetX = Math.max(padding, (targetWidth - sceneWidth) / 2);
  // Scene origin (ground level for building at row=0) in local coords
  // is at Y=0. Buildings extend upward (negative Y) by their height.
  // The tallest building reaches Y = -maxHeight in local coords.
  // We place the scene origin at contentY + maxHeight so the tallest
  // building top aligns with contentY (just below the header).
  const sceneOriginY = contentY + maxHeight + 6;

  const buildingElements: import("../../render/svg/builder.ts").SvgElement[] =
    [];

  // Render buildings back-to-front: iterate weeks (columns) from
  // left to right, and days (rows) from top to bottom. In
  // isometric view, buildings with higher (col + row) overlap
  // those with lower, so we render in ascending (col + row) order.
  //
  // Collect all buildings then sort by draw order.
  interface Building {
    col: number;
    row: number;
    count: number;
    drawOrder: number;
  }

  const buildings: Building[] = [];

  for (let col = 0; col < totalWeeks; col++) {
    const week = data.weeks[col];
    if (week === undefined) continue;
    for (let row = 0; row < week.contributionDays.length; row++) {
      const day = week.contributionDays[row];
      if (day === undefined) continue;
      buildings.push({
        col,
        row,
        count: day.count,
        drawOrder: col + row,
      });
    }
  }

  // Sort by draw order (ascending) — farther buildings drawn first
  buildings.sort((a, b) => a.drawOrder - b.drawOrder);

  // Render a ground plane — a single isometric rectangle that
  // forms the floor of the cityscape. This gives spatial context
  // without needing every zero-contribution cell to be visible.
  const gpLeft = -COS30 * cellW;
  const gpRight = totalWeeks * COS30 * cellW + COS30 * cellW;
  const gpBack = (0 + 0) * SIN30 * cellH - SIN30 * cellH;
  const gpFront = (totalWeeks + totalRows) * SIN30 * cellH + SIN30 * cellH;

  // Ground plane diamond
  const groundPath = [
    `M${r((totalWeeks / 2) * COS30 * cellW)},${r(gpBack)}`,
    `L${r(gpRight)},${r(((totalWeeks + totalRows) / 2) * SIN30 * cellH)}`,
    `L${r((totalWeeks / 2) * COS30 * cellW)},${r(gpFront)}`,
    `L${r(gpLeft)},${r(((totalWeeks + totalRows) / 2) * SIN30 * cellH)}`,
    "Z",
  ].join(" ");

  buildingElements.unshift(
    path(groundPath, {
      fill: colours.calendar.L0,
      stroke: colours.border,
      "stroke-width": 0.5,
    }),
  );

  for (const building of buildings) {
    const { col, row, count } = building;

    // Skip zero-contribution cells — the ground plane already
    // provides the spatial context for empty cells.
    if (count === 0) continue;

    const colour = contributionColour(count);
    // Active contribution buildings scale to max_height proportionally
    const height = Math.max((count / maxCount) * maxHeight, 3);

    // Top face (lightest)
    const topFill = lighten(colour, 0.3);
    const topStroke = darken(colour, 0.3);
    const topPath = topFacePoints(col, row, height, cellW, cellH);
    buildingElements.push(
      path(topPath, {
        fill: topFill,
        stroke: topStroke,
        "stroke-width": 0.5,
      }),
    );

    // Side faces
    // Right face (medium)
    const rPath = rightFacePoints(col, row, height, maxHeight, cellW, cellH);
    buildingElements.push(
      path(rPath, {
        fill: colour,
        stroke: darken(colour, 0.3),
        "stroke-width": 0.5,
      }),
    );

    // Left face (darkest)
    const lPath = leftFacePoints(col, row, height, maxHeight, cellW, cellH);
    buildingElements.push(
      path(lPath, {
        fill: darken(colour, 0.2),
        stroke: darken(colour, 0.4),
        "stroke-width": 0.5,
      }),
    );
  }

  // Wrap all buildings in a group with the offset transform.
  // SMIL animateTransform provides a gentle rocking animation
  // (±1.5° over 12s) that conveys 3D depth. SMIL works when
  // the SVG is viewed directly; CSS animations are disabled
  // when SVG is loaded as an <img> element.
  const sceneCentreX = String(sceneWidth / 2);
  const sceneCentreY = String((sceneDepth + maxHeight) / 2);
  const innerGroup = g(
    {
      class: "skyline-scene",
    },
    ...buildingElements,
    {
      tag: "animateTransform",
      attrs: {
        attributeName: "transform",
        type: "rotate",
        values: `${String(-1.5)} ${sceneCentreX} ${sceneCentreY}; ${String(1.5)} ${sceneCentreX} ${sceneCentreY}; ${String(-1.5)} ${sceneCentreX} ${sceneCentreY}`,
        dur: "12s",
        repeatCount: "indefinite",
      },
    },
  );

  elements.push(
    g(
      {
        transform: `translate(${String(offsetX)},${String(sceneOriginY)})`,
      },
      innerGroup,
    ),
  );

  const totalHeight = sceneOriginY + sceneDepth + 20;

  return { height: totalHeight, elements };
}
