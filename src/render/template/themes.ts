/**
 * Theme definitions — colour palettes and spacing constants.
 *
 * A theme provides all visual parameters needed for rendering.
 * Templates select a theme and use its values for every visual decision.
 */

import type { Theme } from "../../plugins/types.ts";

/** Classic theme — clean, minimal, dark background. */
export const classic: Theme = {
  width: 480,
  sectionPadding: 16,
  margin: 16,
  fontStack: "'Roboto', sans-serif",
  colours: {
    text: "#e6edf3",
    textSecondary: "#8b949e",
    textTertiary: "#6e7681",
    accent: "#58a6ff",
    background: "#0d1117",
    border: "#30363d",
    error: "#f85149",
    warning: "#d29922",
    success: "#3fb950",
    calendar: {
      L0: "#161b22",
      L1: "#0e4429",
      L2: "#006d32",
      L3: "#26a641",
      L4: "#39d353",
    },
  },
};

/** Light theme — GitHub light. */
export const light: Theme = {
  width: 480,
  sectionPadding: 16,
  margin: 16,
  fontStack: "'Roboto', sans-serif",
  colours: {
    text: "#1f2328",
    textSecondary: "#656d76",
    textTertiary: "#8c959f",
    accent: "#0969da",
    background: "#ffffff",
    border: "#d0d7de",
    error: "#cf222e",
    warning: "#bf8700",
    success: "#1a7f37",
    calendar: {
      L0: "#ebedf0",
      L1: "#9be9a8",
      L2: "#40c463",
      L3: "#30a14e",
      L4: "#216e39",
    },
  },
};

/** Terminal theme — monospace, green on black. */
export const terminal: Theme = {
  width: 480,
  sectionPadding: 16,
  margin: 16,
  fontStack: "'Courier New', monospace",
  colours: {
    text: "#33ff33",
    textSecondary: "#22aa22",
    textTertiary: "#116611",
    accent: "#33ff33",
    background: "#000000",
    border: "#22aa22",
    error: "#ff3333",
    warning: "#ffff33",
    success: "#33ff33",
    calendar: {
      L0: "#002200",
      L1: "#004400",
      L2: "#006600",
      L3: "#008800",
      L4: "#00cc00",
    },
  },
};

/** Theme registry — lookup by name. */
const themes = new Map<string, Theme>([
  ["classic", classic],
  ["light", light],
  ["terminal", terminal],
]);

/**
 * Resolve a theme by name.
 *
 * @throws if the theme name is not found
 */
export function resolveTheme(name: string): Theme {
  const theme = themes.get(name);
  if (theme === undefined) {
    throw new Error(
      `Unknown theme "${name}". Available: ${[...themes.keys()].join(", ")}`,
    );
  }
  return theme;
}
