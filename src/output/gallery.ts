/**
 * Generate an index.html gallery page from pipeline outputs.
 *
 * Groups outputs into presets and individual plugins, renders
 * each SVG as an inline preview with a download link.
 */

export interface IndexEntry {
  path: string;
  label: string;
  group: "preset" | "plugin";
}

const PRESET_PATHS = new Set([
  "output/github-metrics.svg",
  "output/compact.svg",
  "output/contributions.svg",
  "output/code-languages.svg",
  "output/social.svg",
  "output/activity-feed.svg",
]);

const PRESET_LABELS: Record<string, string> = {
  "output/github-metrics.svg": "Full dashboard",
  "output/compact.svg": "Compact profile",
  "output/contributions.svg": "Contribution landscape",
  "output/code-languages.svg": "Code & languages",
  "output/social.svg": "Social graph",
  "output/activity-feed.svg": "Activity feed",
};

/**
 * Categorise an output path as preset or plugin.
 *
 * @internal exported for testing
 */
export function categorise(path: string): IndexEntry {
  if (PRESET_PATHS.has(path)) {
    return { path, label: PRESET_LABELS[path] ?? path, group: "preset" };
  }
  // output/plugins/foo.svg → "Foo"
  const fileName = path.split("/").pop() ?? path;
  const stem = fileName.replace(/\.svg$/, "").replace(/\.png$/, "");
  const label = stem
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return { path, label, group: "plugin" };
}

/**
 * Generate an index.html page that displays all output SVGs.
 *
 * Uses GitHub-dark styling to match the classic theme.
 * Each SVG is shown as an inline preview with a link to the
 * standalone file.
 */
export function generateIndex(outputs: string[], username: string): string {
  const entries = outputs.map(categorise);
  const presets = entries.filter((e) => e.group === "preset");
  const plugins = entries.filter((e) => e.group === "plugin");

  const now = new Date().toISOString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Metrics — ${esc(username)}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  background: #0d1117;
  color: #e6edf3;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; }
h2 { font-size: 1.1rem; font-weight: 600; color: #8b949e; margin: 2rem 0 1rem; border-bottom: 1px solid #30363d; padding-bottom: 0.5rem; }
.subtitle { color: #8b949e; font-size: 0.875rem; margin-bottom: 1.5rem; }
.timestamp { color: #6e7681; font-size: 0.75rem; margin-bottom: 2rem; }
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.card {
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  overflow: hidden;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #30363d;
  font-size: 0.8rem;
}
.card-header a {
  color: #58a6ff;
  text-decoration: none;
}
.card-header a:hover { text-decoration: underline; }
.card-name { color: #e6edf3; font-weight: 500; }
.card-preview {
  padding: 0.75rem;
  overflow-x: auto;
}
.card-preview img {
  max-width: 100%;
  height: auto;
  display: block;
}
</style>
</head>
<body>

<h1>&#x1F4CA; Metrics</h1>
<p class="subtitle">Generated metrics for <strong>${esc(username)}</strong></p>
<p class="timestamp">Last updated: ${now}</p>

${sectionHtml("Presets", presets)}
${sectionHtml("Plugins", plugins)}

</body>
</html>`;
}

function sectionHtml(title: string, entries: IndexEntry[]): string {
  if (entries.length === 0) return "";
  const cards = entries.map(cardHtml).join("\n");
  return `<h2>${esc(title)}</h2>
<div class="grid">
${cards}
</div>`;
}

function cardHtml(entry: IndexEntry): string {
  // Paths are relative to the output directory (the Pages root).
  // Strip the leading "output/" so they resolve correctly.
  const href = entry.path.startsWith("output/")
    ? entry.path.slice("output/".length)
    : entry.path;
  return `  <div class="card">
    <div class="card-header">
      <span class="card-name">${esc(entry.label)}</span>
      <a href="${esc(href)}" target="_blank">Open &rarr;</a>
    </div>
    <div class="card-preview">
      <img src="${esc(href)}" alt="${esc(entry.label)} metrics" loading="lazy">
    </div>
  </div>`;
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
