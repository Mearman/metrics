# 📊 Metrics

> Fork of [lowlighter/metrics](https://github.com/lowlighter/metrics), overhauled.
> Generate GitHub metrics as SVG — embeddable in profile READMEs and beyond.

## Quick start

### Fork mode (zero config)

1. **Fork** this repository
2. **Enable GitHub Pages** in your fork: Settings → Pages → Source: "GitHub Actions"
3. **Enable GitHub Actions** in your fork: Actions tab → enable workflows
4. **Done.** Your metrics SVG is generated hourly and served at:
   ```
   https://<username>.github.io/metrics/github-metrics.svg
   ```
5. **Add to your profile README** (`<username>/<username>` repo):
   ```markdown
   ![Metrics](https://<username>.github.io/metrics/github-metrics.svg)
   ```

No token. No secrets. No config. Fork, enable, done.

The `github.token` automatically provided to every Actions run has read access to all public GitHub data — your profile, public repos, contributions, languages, everything public. Only users who want private repo contributions in their metrics need to create a personal access token.

To customise, edit `.github/metrics.yml` in your fork.

### Staying up to date

Your fork automatically syncs with `Mearman/metrics` daily via the **Sync upstream** workflow. When upstream adds new plugins, fixes bugs, or improves layouts, your fork pulls those changes automatically.

If the merge conflicts with your local customisations, the sync will fail — resolve conflicts manually:

```bash
git remote add upstream https://github.com/Mearman/metrics.git
git fetch upstream main
git merge upstream/main
# resolve conflicts, then:
git push
```

You can also trigger a sync manually from your fork's **Actions** tab → **Sync upstream** → **Run workflow**.

### Action mode

Use metrics as an action in your own repository. Zero-config — enable plugins with boolean inputs:

```yaml
# .github/workflows/metrics.yml
name: Metrics
on:
  schedule: [{ cron: "0 * * * *" }]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: Mearman/metrics@latest
        with:
          token: ${{ secrets.METRICS_TOKEN || github.token }}
          plugin_base: true
          plugin_isocalendar: true
          plugin_languages: true
          plugin_habits: true
          plugin_achievements: true
          plugin_lines: true
          plugin_activity: true
          plugin_stars: true
          plugin_followup: true
          plugin_stargazers: true
          plugin_people: true
          plugin_topics: true
          plugin_licenses: true
      - uses: actions/upload-pages-artifact@v5
        with:
          path: output

  deploy:
    needs: generate
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v5
        id: deployment
```

Or provide a `.github/metrics.yml` for full control — see [Configuration](#configuration).

### Local development

```bash
pnpm install
GITHUB_TOKEN=$(gh auth token) node src/cli.ts
```

---

## Configuration

```yaml
# .github/metrics.yml

# Omit `user` to auto-detect from the repository owner (fork mode)
# user: Mearman
timezone: Europe/London
template: classic

outputs:
  - path: output/github-metrics.svg
    format: svg
    plugins:
      base:
        sections: [header, activity, community, repositories, metadata]
        indepth: true
      isocalendar:
        duration: full-year
      languages:
        limit: 8
        threshold: 5
        categories: [markup, programming]
        recent_days: 14
      habits:
        days: 14
        from: 200
        charts: true
        facts: true
      achievements:
        display: detailed
        secrets: true
        threshold: C
      lines:
        limit: 4
```

Config is loaded via [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig), which searches for:
- `.github/metrics.yml`
- `.github/metrics.yaml`
- `.github/metrics.json`
- `.metricsrc`, `.metricsrc.yml`, `.metricsrc.json`
- `metrics.config.ts`, `metrics.config.js`

### Repository filtering

By default, only public repositories are included in metrics. To include private repositories (requires a PAT with `repo` scope):

```yaml
repos:
  fetch: all              # "public" (default) or "all"
  rules:                  # Evaluated top-to-bottom, first match wins
    - match: "secret-project"   # Exact name match
      action: exclude           # Skip entirely (not counted or named)
    - match: "Mearman/*"        # Glob pattern
      action: include           # Count and name
    - match: /internal-/        # Regex (wrapped in /.../)
      action: count             # Count in totals, but don't name
    - match:                     # Property match
        visibility: private
        org: AcmeCorp
      action: count
```

**Actions:**
- `include` — repo contributes to totals **and** appears in per-repo lists by name
- `count` — repo contributes to aggregate totals but is **not named** in per-repo lists
- `exclude` — repo is skipped entirely

**Defaults (when no rule matches):**
- Public repos → `include`
- Private repos → `count`

This means `repos: { fetch: all }` with no rules is safe — private repos boost your language stats and totals without revealing their names.

### Plugin ordering

By default, plugins render in the order they appear in your YAML. To control section order explicitly:

```yaml
outputs:
  - path: output/github-metrics.svg
    format: svg
    order:                # Render these plugins first, in this order
      - isocalendar
      - languages
      - base
    plugins:
      base: {}
      isocalendar: { duration: full-year }
      languages: { limit: 8 }
      habits: { charts: true }   # not in `order`, so rendered after
```

Plugins listed in `order` render first (in that order). Any plugins not listed are appended in their YAML key order.

---

## Token tiers

| Token | Data scope | Rate limit | Setup |
|---|---|---|---|
| `github.token` (default) | Public data only | 1,000 req/hr | None — automatic |
| PAT with `public_repo` scope | Public data + higher rate limit | 5,000 req/hr | Create token, add as `METRICS_TOKEN` secret |
| PAT with `repo` scope | Public + private data | 5,000 req/hr | Create token, add as `METRICS_TOKEN` secret |

All 6 plugins work with `github.token` alone. A PAT gives higher rate limits and access to private repo data.

---

## Design decisions

### Pure SVG — no foreignObject, no Puppeteer

The original embeds HTML inside SVG `<foreignObject>`, then spawns Puppeteer (Chromium) to measure rendered height. This causes cropping/oversizing bugs, cross-browser inconsistencies, and a ~400MB runtime dependency.

We produce pure SVG `<text>`, `<rect>`, `<path>`, `<g>` elements only. Heights are computed exactly at generation time using [fontkit](https://github.com/foliojs/fontkit) for text measurement against bundled fonts. No headless browser.

### Node 26 native TypeScript — no build step

Uses `using: node26` via a composite action with `actions/setup-node`. No compilation, no bundling, no emitted JavaScript. Source files run directly.

### Config-file driven via cosmiconfig

A single YAML config per output. Replaces the original's ~300 flat `plugin_*` action inputs. Cosmiconfig handles file discovery and format detection automatically.

### GitHub Pages, not git commits

SVGs are deployed via GitHub Pages Actions, not committed back to the repository. Clean source history, CDN-backed serving, no bot commit spam.

### Fork-first design

The default workflow runs the CLI directly. Fork users get automatic hourly generation by enabling Actions and Pages. Customise by editing `.github/metrics.yml`.

---

## Architecture

### Plugin interface: separate data source and renderer

Each plugin composes two independent concerns — a **data source** (fetches from GitHub APIs) and a **renderer** (produces SVG elements). They vary independently: test rendering with mock data, swap renderers per template, add templates without touching plugin code.

```typescript
interface DataSource<TConfig, TData> {
  id: string
  configSchema: z.ZodType<TConfig>
  fetch(ctx: FetchContext, config: TConfig): Promise<TData>
}

interface Renderer<TData, TConfig> {
  render(data: TData, config: TConfig, ctx: RenderContext): RenderResult
}

interface Plugin<TConfig, TData> {
  id: string
  source: DataSource<TConfig, TData>
  renderer: Renderer<TData, TConfig>
}
```

### Rendering pipeline

```
Config → Resolve plugins
       → Fetch (sequential, per-plugin, with error recovery)
       → Render (sequential, config order)
       → Layout (vertical stack with translate offsets)
       → Serialise (element tree → SVG string)
       → Write (output/*.svg)
```

### SVG element builder

Element objects, not template strings:

```typescript
interface SvgElement {
  tag: string
  attrs: Record<string, string | number>
  children?: SvgElement[]
  text?: string
}
```

Builder functions (`svg`, `g`, `text`, `rect`, `circle`, `path`, `image`) return `SvgElement` objects. `serialise()` converts the tree to an SVG string with XML entity escaping.

### Text measurement

[fontkit](https://github.com/foliojs/fontkit) loads bundled Roboto font. Exact glyph advance widths without a browser.

### Themes

Three built-in themes: `classic` (dark), `light`, `terminal` (monospace green on black). Each theme defines colours, spacing, font stack, and calendar heatmap colours.

---

## Plugins

27 plugins implemented (4 not feasible, 1 needs external API).

| Plugin       | ID              | Status | Description                            |
|--------------|-----------------|--------|----------------------------------------|
| Base         | `base`          | ✅     | User profile header, avatar, stats     |
| Languages    | `languages`     | ✅     | Language breakdown with stacked bar    |
| Isocalendar  | `isocalendar`   | ✅     | Contribution heatmap calendar          |
| Habits       | `habits`        | ✅     | Commit timing stats with activity bars |
| Achievements | `achievements`  | ✅     | Derived badges with tier indicators    |
| Lines        | `lines`         | ✅     | Per-repo code size breakdown            |
| Repositories | `repositories`  | ✅     | Pinned/featured repository cards       |
| Activity     | `activity`      | ✅     | Recent events timeline                 |
| Stars        | `stars`         | ✅     | Recently starred repositories          |
| Followup     | `followup`      | ✅     | Issue/PR status progress bars          |
| Stargazers   | `stargazers`    | ✅     | Per-repo star count bar chart          |
| People       | `people`        | ✅     | Followers/following avatar grid        |
| Gists        | `gists`         | ✅     | Gist statistics card                   |
| Discussions | `discussions`   | ✅     | Discussion stats with category bars    |
| Notable      | `notable`       | ✅     | Notable contribution orgs              |
| Calendar     | `calendar`      | ✅     | Yearly contribution calendars          |
| Introduction | `introduction`  | ✅     | User bio and introduction card         |
| Reactions    | `reactions`     | ✅     | Comment reaction stats                 |
| Contributors | `contributors`  | ✅     | Per-repo contributor breakdown         |
| Code         | `code`          | ✅     | Random code snippet from recent commits |
| Topics       | `topics`        | ✅     | Repository topic/tag cloud             |
| Licences     | `licenses`      | ✅     | Repository licence breakdown           |
| LoC          | `loc`           | ✅     | Actual lines of code per repo          |
| Projects     | `projects`      | ✅     | GitHub Projects v2 boards              |
| Skyline      | `skyline`       | ✅     | 3D isometric contribution cityscape    |
| Sponsors     | `sponsors`      | ✅     | GitHub Sponsors card (needs PAT)       |
| Sponsorships | `sponsorships`  | ✅     | Active sponsorships (needs PAT)        |
| Star lists   | `starlists`     | ❌     | Not available in GitHub API            |
| Starred topics| `starred-topics`| ❌     | Covered by `topics` plugin             |
| Traffic      | `traffic`       | ✅     | Repository traffic (needs PAT)         |

---

## Dependencies

| Package            | Purpose                            |
|--------------------|------------------------------------|
| `zod`              | Config and API response validation |
| `@octokit/rest`    | GitHub REST + GraphQL API client   |
| `cosmiconfig`      | Config file discovery and parsing  |
| `fontkit`          | Font loading and text measurement  |
| `@primer/octicons` | Octicon SVG path data              |
| `svgo`             | SVG optimisation                   |
| `@actions/core`    | GitHub Action I/O                  |
| `@actions/github`  | GitHub Action context              |

No Puppeteer. No Sharp. No EJS. No Express. No Docker.

---

## Licence

[MIT](LICENSE) — original licence from [lowlighter/metrics](https://github.com/lowlighter/metrics) retained.
