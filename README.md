# 📊 Metrics

> Fork of [lowlighter/metrics](https://github.com/lowlighter/metrics), overhauled.
> Generate GitHub metrics as SVG — embeddable in profile READMEs and beyond.

*Work in progress. See [design decisions](#design-decisions) and [implementation plan](#implementation-plan) below.*

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

### Action mode

Use metrics as an action in your own repository:

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
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Mearman/metrics@latest
        with:
          token: ${{ secrets.METRICS_TOKEN }}  # optional — falls back to github.token
      - uses: actions/upload-pages-artifact@v3
        with:
          path: output
      - uses: actions/deploy-pages@v4
```

### Local development

```bash
pnpm install
GITHUB_TOKEN=ghp_... pnpm run dev --config .github/metrics.yml
```

CLI mode is essential for iteration speed — no need to push to GitHub Actions to test rendering changes.

---

## Usage tiers

| Tier | Setup | Updates | Customisation |
|---|---|---|---|
| **Default fork** | Fork → enable Actions + Pages | Automatic (`Mearman/metrics@latest`) | Config only (`.github/metrics.yml`) |
| **Customised fork** | Switch workflow to `uses: ./` | Auto-sync from upstream (configurable) | Modify source, templates, plugins |
| **Action mode** | Add `uses: Mearman/metrics@latest` to your own repo | Automatic | Config only |

The fork's workflow runs `uses: Mearman/metrics@latest` by default, so the action code always comes from upstream. The fork only holds config and serves the output via Pages. No upstream sync needed.

Users who want to customise the source (templates, plugins, rendering) switch to `uses: ./`. The same workflow includes a configurable upstream sync step that keeps the fork's source code current.

---

## Configuration

<!-- TODO: Link to full config reference once docs exist -->

```yaml
# .github/metrics.yml

# Omit `user` to auto-detect from the repository owner (fork mode)
# user: Mearman
timezone: Europe/London
template: classic

outputs:
  - path: github-metrics.svg
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
        sections: base
        repositories_limit: 4
        history_limit: 1
```

### Upstream sync (customised forks only)

When using `uses: ./`, the workflow can sync source code from upstream before generating metrics. Configured in `.github/metrics.yml`:

```yaml
sync:
  upstream: Mearman/metrics
  branch: main
  auto_merge: true   # true → merge directly, false → open a PR for review
```

- **`auto_merge: true`** (default) — upstream changes merge into the fork automatically. Generation proceeds with the latest code.
- **`auto_merge: false`** — upstream changes open a pull request. Generation proceeds with the fork's current code (never blocked by a pending review).
- **Omit `sync` section** — no sync. The fork stays at whatever version it's on.

If a merge conflicts with local customisations, the workflow fails visibly and the user resolves it manually.

---

## Token tiers

| Token | Data scope | Rate limit | Setup |
|---|---|---|---|
| `github.token` (default) | Public data only | 1,000 req/hr | None — automatic |
| PAT with `public_repo` scope | Public data + higher rate limit | 5,000 req/hr | Create token, add as `METRICS_TOKEN` secret |
| PAT with `repo` scope | Public + private data (own repos + orgs) | 5,000 req/hr | Create token, add as `METRICS_TOKEN` secret |

To use a PAT in fork mode, add it as a repository secret (`Settings → Secrets → Actions → METRICS_TOKEN`). The workflow uses it if present, falls back to `github.token` otherwise.

```yaml
- uses: Mearman/metrics@latest
  with:
    token: ${{ secrets.METRICS_TOKEN || github.token }}
```

**Public data + higher rate limit:** [Create a fine-grained token](https://github.com/settings/personal-access-tokens/new?name=Metrics%20%28public%29&description=Read-only%20access%20to%20public%20repo%20data%20for%20metrics%20generation&expires_in=none&contents=read&metadata=read)

**Public + private data:** [Create a fine-grained token](https://github.com/settings/personal-access-tokens/new?name=Metrics%20%28all%20repos%29&description=Read%20access%20to%20all%20repo%20data%20%28public%20%2B%20private%29%20for%20metrics%20generation&expires_in=none&contents=read&metadata=read&commit_signatures=read)

Both links pre-fill the token name, description, and required permissions. After opening the link, select your account as the resource owner and choose "All repositories" to cover your full profile.

---

## Action inputs

| Input     | Description                          | Default               |
|-----------|--------------------------------------|-----------------------|
| `token`   | GitHub token (PAT or `github.token`) | `github.token`        |
| `config`  | Path to YAML config file             | `.github/metrics.yml` |
| `dry-run` | Generate without writing output      | `false`               |

---

## Design decisions

### Pure SVG — no foreignObject, no Puppeteer

The original embeds HTML inside SVG `<foreignObject>`, then spawns Puppeteer (Chromium) to measure rendered height. This causes cropping/oversizing bugs, cross-browser inconsistencies, and a ~400MB runtime dependency.

We produce pure SVG `<text>`, `<rect>`, `<path>`, `<g>` elements only. Heights are computed exactly at generation time using `opentype.js` for text measurement against bundled fonts. No headless browser.

| Visual element       | Original (foreignObject)     | Ours (pure SVG)                        |
|----------------------|------------------------------|----------------------------------------|
| Section headings     | HTML `<h2>`                  | SVG `<text font-weight="bold">`       |
| Body text            | HTML `<div>` / `<span>`      | SVG `<text>`                           |
| Progress bars        | HTML `<div>` + CSS width     | SVG `<rect>` with calculated widths    |
| Language colour bar  | HTML + CSS                   | SVG `<rect>` mask pattern              |
| Contribution grid    | SVG `<rect>` (already pure)  | Same                                   |
| Isometric calendar   | SVG `<path>` (already pure)  | Same                                   |
| Avatars              | HTML `<img>`                 | SVG `<image href="data:...">` base64   |
| Icons                | Inline SVG `<path>`          | Same (Octicon paths)                   |
| Bar charts           | HTML + CSS flexbox           | SVG `<rect>` elements, computed widths |
| Multi-column layout  | CSS flexbox                  | SVG `<g>` with computed translate x    |

### TypeScript throughout

Typed plugin interfaces, typed API responses, Zod validation at every boundary. No `any`, no `as` casts.

### Config-file driven

A single YAML config per output. Replaces the original's ~300 flat `plugin_*` action inputs.

### GraphQL-first

Bulk data via GitHub GraphQL API (typed queries, automatic pagination). REST only where GraphQL doesn't expose the data (traffic, gists, file contents).

### GitHub Pages, not git commits

SVGs are deployed via GitHub Pages Actions, not committed back to the repository. The original commits an SVG on every hourly run, polluting git history with meaningless bot commits. Pages deployments are ephemeral — clean source history, CDN-backed serving, no `git log` spam.

### Fork-first design

The default workflow uses `Mearman/metrics@latest`, so fork users get updates automatically without any sync mechanism. The fork only holds config (`.github/metrics.yml`) and receives output via Pages. Users who customise the source switch to `uses: ./` and opt into upstream sync.

---

## Architecture

### Project structure

```
src/
├── index.ts                    # CLI entry point
├── action/
│   ├── main.ts                 # GitHub Action entry point
│   └── action.yml              # GitHub Action descriptor
│
├── config/
│   ├── schema.ts               # Root config Zod schema
│   └── types.ts                # Inferred config types
│
├── api/
│   ├── client.ts               # Octokit wrapper (GraphQL + REST)
│   ├── graphql/
│   │   ├── queries/            # Named GraphQL query strings
│   │   │   ├── user.ts
│   │   │   ├── contributions.ts
│   │   │   ├── repositories.ts
│   │   │   └── ...
│   │   └── pagination.ts       # GraphQL pagination helpers
│   └── rest/
│       └── endpoints.ts        # REST API call wrappers
│
├── plugins/
│   ├── types.ts                # DataSource, Renderer, Plugin interfaces
│   ├── registry.ts             # Plugin registration and discovery
│   ├── base/
│   │   ├── source.ts           # Data fetching
│   │   └── render.ts           # SVG rendering
│   ├── achievements/
│   ├── activity/
│   ├── calendar/
│   ├── code/
│   ├── contributors/
│   ├── discussions/
│   ├── followup/
│   ├── gists/
│   ├── habits/
│   ├── introduction/
│   ├── isocalendar/
│   ├── languages/
│   ├── licenses/
│   ├── lines/
│   ├── notable/
│   ├── people/
│   ├── projects/
│   ├── reactions/
│   ├── repositories/
│   ├── skyline/
│   ├── sponsors/
│   ├── sponsorships/
│   ├── stargazers/
│   ├── starlists/
│   ├── stars/
│   ├── topics/
│   └── traffic/
│
├── render/
│   ├── engine.ts               # Orchestrates plugin render → final SVG
│   ├── svg/
│   │   ├── builder.ts          # Typed SVG element builder
│   │   ├── serialise.ts        # Element objects → SVG string
│   │   ├── text.ts             # Text measurement and rendering
│   │   ├── icons.ts            # Octicon SVG path data
│   │   └── shapes.ts           # Rect, circle, line, polygon helpers
│   ├── layout/
│   │   ├── stack.ts            # Vertical stack layout
│   │   ├── grid.ts             # Horizontal grid (multi-column sections)
│   │   └── measure.ts          # Text width/height measurement
│   └── template/
│       ├── types.ts            # Template interface
│       └── classic.ts          # Classic template (renderers + layout + theme)
│
├── output/
│   ├── svg.ts                  # SVG optimisation (SVGO) and file writing
│   └── png.ts                  # Optional PNG output (resvg-js)
│
└── utils/
    ├── colour.ts               # Colour manipulation
    ├── format.ts               # Number, date, byte formatting
    ├── escape.ts               # XML/SVG entity escaping
    └── fonts.ts                # Font loading and registration
```

### Plugin interface: separate data source and renderer

Each plugin composes two independent concerns — a **data source** (fetches from GitHub APIs) and a **renderer** (produces SVG elements). This separation follows the portable boundary principle: data fetching is the compute boundary, rendering is the output boundary, and they vary independently.

```typescript
/** Fetches data from GitHub APIs */
interface DataSource<TConfig, TData> {
  id: string
  configSchema: z.ZodType<TConfig>
  fetch(ctx: FetchContext, config: TConfig): Promise<TData>
}

/** Renders data into visual elements */
interface Renderer<TData, TConfig> {
  render(data: TData, config: TConfig, ctx: RenderContext): RenderResult
}

/** A plugin composes a data source with a renderer */
interface Plugin<TConfig, TData> {
  id: string
  source: DataSource<TConfig, TData>
  renderer: Renderer<TData, TConfig>
}
```

Why separate:
- **Test rendering without hitting the API** — mock data sources, exercise renderers in isolation
- **Swap renderers per template** — the `classic` template renders languages as a horizontal bar; a `terminal` template renders them as a text table. Same data, different renderer
- **Templates select renderers** — a template is a registry of renderer implementations. Adding a template means writing renderers, not modifying plugins

### Templates as renderer registries

A template is not just colours and spacing — it's a set of renderer implementations for each plugin, plus a layout strategy and a theme:

```typescript
interface Template {
  id: string
  theme: Theme

  /** Map plugin IDs to their renderer for this template */
  renderers: Record<string, Renderer<unknown, unknown>>

  /** Overall layout — how to stack plugin sections into a final SVG */
  layout(sections: RenderResult[], theme: Theme): SvgElement
}
```

Initially ships with `classic`, replicating the original's visual style. Adding a `terminal` or `markdown` template means writing a new module with its own renderers and layout — no plugin code changes.

### RenderContext

Renderers receive their dependencies through a context object, not by reaching for globals:

```typescript
interface RenderContext {
  measure: Measure
  theme: Theme
  icons: IconLookup
  /** Current Y position in the vertical stack */
  cursor: { y: number }
  /** Available content width */
  contentWidth: number
}
```

### Rendering pipeline

```
Config → Resolve plugins
       → Fetch (concurrent, AbortSignal for cancellation)
       → Resolve template → select renderers
       → Render (sequential, config order, template renderers)
       → Layout (template stacks sections with exact heights)
       → Serialise (element tree → SVG string)
       → Optimise (SVGO)
       → Write (output/*.svg, optional output/*.png)
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

Builder functions (`svg`, `g`, `text`, `rect`, `circle`, `path`, `image`) return `SvgElement` objects. `serialise()` converts the tree to an SVG string.

### Text measurement

`opentype.js` loads bundled Inter font files. Gives exact glyph advance widths — no browser needed.

```typescript
interface Measure {
  textWidth(content: string, fontSize: number, fontWeight?: number): number
  textBlockHeight(lines: string[], fontSize: number, lineHeight: number): number
}
```

### API layer

- **GraphQL**: typed query functions with automatic pagination (GitHub limits connections to 100 items)
- **REST**: fallback for traffic, gists, and file contents — data not exposed via GraphQL
- **Zod validation** on every API response at the boundary — schema-attached type guards via `.is`

### Shared data sources

Multiple plugins often need the same data (e.g. the user's repository list). Named data sources in config are fetched once and shared:

```yaml
sources:
  public-repos:
    type: repositories
    privacy: public
    limit: 100
    forks: false

outputs:
  - path: github-metrics.svg
    plugins:
      languages:
        source: public-repos  # reference — shared fetch
        limit: 8
      habits:
        source: public-repos  # same source, not fetched twice
        days: 14
```

---

## Plugins

29 GitHub plugins. Each follows the data source → renderer contract.

| Plugin       | ID              | API         | Data fetched                                    |
|--------------|-----------------|-------------|-------------------------------------------------|
| Base         | `base`          | GraphQL     | User profile, repos, activity summary           |
| Achievements | `achievements`  | GraphQL+REST| Badges, ranks, secrets                          |
| Activity     | `activity`      | REST        | Recent events feed                              |
| Calendar     | `calendar`      | GraphQL     | Flat contribution calendar                      |
| Code         | `code`          | REST        | Random code snippet                             |
| Contributors | `contributors`  | REST        | Per-repo contributor breakdown                  |
| Discussions  | `discussions`   | GraphQL     | Discussion stats and categories                 |
| Follow-up    | `followup`      | GraphQL     | Issue/PR status tracking                        |
| Gists        | `gists`         | REST        | User's gists                                    |
| Habits       | `habits`        | REST        | Coding time analysis, language habits, facts    |
| Introduction | `introduction`  | GraphQL     | User bio and introduction card                  |
| Isocalendar  | `isocalendar`   | GraphQL     | Isometric 3D contribution calendar              |
| Languages    | `languages`     | GraphQL     | Language breakdown, indepth analysis            |
| Licences     | `licenses`      | REST        | Repository licence breakdown                    |
| Lines        | `lines`         | GraphQL     | Lines added/removed history                     |
| Notable      | `notable`       | GraphQL     | Notable org/project contributions               |
| People       | `people`        | REST        | Followers, following, sponsors                  |
| Projects     | `projects`      | GraphQL     | GitHub Projects boards                          |
| Reactions    | `reactions`     | GraphQL     | Comment reaction stats                          |
| Repositories | `repositories`  | REST        | Featured/pinned repositories                    |
| Skyline      | `skyline`       | External    | GitHub Skyline 3D visualisation                 |
| Sponsors     | `sponsors`      | REST        | Sponsor card and details                        |
| Sponsorships | `sponsorships`  | REST        | Active sponsorships                             |
| Stargazers   | `stargazers`    | REST        | Star history charts                             |
| Star lists   | `starlists`     | REST        | Repositories from starred lists                 |
| Stars        | `stars`         | REST        | Recently starred repositories                   |
| Topics       | `topics`        | REST        | Starred topics                                  |
| Traffic      | `traffic`       | REST        | Repository traffic (views, clones)              |

### Implementation plan

**Phase 1 — Core rendering pipeline:**
1. SVG builder + serialiser
2. Text measurement (opentype.js)
3. Layout engine (vertical stack)
4. Template system
5. Config parsing and validation
6. Action entry point + Pages workflow

**Phase 2 — Essential plugins (current usage):**
1. `base`
2. `isocalendar`
3. `languages`
4. `habits`
5. `achievements`
6. `lines`

**Phase 3 — Remaining GitHub plugins:**
All 23 remaining plugins from the table above.

---

## Dependencies

| Package            | Purpose                            |
|--------------------|------------------------------------|
| `zod`              | Config and API response validation |
| `@octokit/graphql` | GitHub GraphQL API client          |
| `@octokit/rest`    | GitHub REST API client             |
| `opentype.js`      | Font loading and text measurement  |
| `@resvg/resvg-js`  | Optional SVG → PNG conversion      |
| `svgo`             | SVG optimisation                   |
| `yaml`             | YAML config parsing                |
| `@actions/core`    | GitHub Action I/O                  |
| `@actions/github`  | GitHub Action context              |

No Puppeteer. No Sharp. No EJS. No Express. No Docker.

---

## Provenance

Fork of [lowlighter/metrics](https://github.com/lowlighter/metrics) by [Simon Lecoq](https://github.com/lowlighter). The original's git history is preserved in the fork relationship.

### What we keep

- **Visual design** — classic template look, spacing, colour palette, section structure
- **Plugin concept and feature set** — same 29 GitHub plugins with equivalent configuration
- **GitHub Action workflow pattern** — scheduled generation
- **MIT licence and attribution**

### What we replace

| Original                      | Replacement                        | Why                                           |
|-------------------------------|------------------------------------|-----------------------------------------------|
| EJS templates                 | TypeScript SVG builder functions   | Type-safe, composable, no template syntax     |
| foreignObject + HTML          | Pure SVG elements                  | No cropping bugs, no browser dependency       |
| Puppeteer (height calc)       | opentype.js text measurement       | Lightweight, deterministic, no Chromium       |
| Sharp (image processing)      | resvg-js (optional PNG output)     | No native compilation issues                  |
| Docker-based action           | Node.js JavaScript action          | Faster startup, simpler, lighter              |
| Flat `plugin_*` inputs (300+) | YAML config file                   | Structured, readable, version-controlled      |
| `.mjs` JavaScript (73%)       | TypeScript                         | Type safety, compile-time errors              |
| Express web server            | None (action + CLI only)           | Not needed for our use case                   |
| Git commits for output        | GitHub Pages deployments           | Clean history, CDN-backed, no bot commit spam |
| `package-lock.json`           | `pnpm-lock.yaml`                   | Faster, disk-efficient                        |

## Licence

[MIT](LICENSE) — original licence from [lowlighter/metrics](https://github.com/lowlighter/metrics) retained.
