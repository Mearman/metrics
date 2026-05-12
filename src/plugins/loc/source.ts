/**
 * Lines of Code plugin — data source.
 *
 * Counts actual lines of code by shallow-cloning repositories
 * and walking the file tree. Each file's line count is attributed
 * to its detected language.
 *
 * Requires git on PATH. Uses only github.token for public repos.
 */

import * as z from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execFileSync } from "node:child_process";
import type { DataSource } from "../types.ts";
import { repoPrivacyFilter } from "../../repos/graphql.ts";
import type { ReposConfig } from "../../repos/filter.ts";
import { detectLanguage, shouldSkip, shouldSkipDir } from "./languages.ts";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const LocConfig = z.object({
  /** Maximum repositories to scan */
  limit: z.int().min(1).max(20).default(4),
  /** Explicit repository list (owner/repo). If empty, uses top repos. */
  repositories: z.array(z.string().trim()).default([]),
  /** Directory to cache cloned repos. If set, repos are cloned here
   *  and reused across runs. Set to empty string to disable caching. */
  cache_dir: z.string().trim().default(""),
});
export type LocConfig = z.infer<typeof LocConfig>;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface RepoLoc {
  name: string;
  totalLines: number;
  isPrivate: boolean;
  languages: { name: string; lines: number; colour: string }[];
}

export interface LocData {
  repos: RepoLoc[];
  totalLines: number;
}

// ---------------------------------------------------------------------------
// GraphQL — fetch user's top repos by size
// ---------------------------------------------------------------------------

const ResponseSchema = z.object({
  user: z.object({
    repositories: z.object({
      nodes: z.array(
        z.object({
          nameWithOwner: z.string().trim(),
          isPrivate: z.boolean(),
          url: z.string().trim(),
          diskUsage: z.number(),
        }),
      ),
    }),
  }),
});

const REPOS_QUERY = `
  query($login: String!, $first: Int!) {
    user(login: $login) {
      repositories(
        first: $first
        __PRIVACY__
        ownerAffiliations: OWNER
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          isPrivate
          url
          diskUsage
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Clone + scan
// ---------------------------------------------------------------------------

/**
 * Shallow-clone or update a repo and count lines.
 *
 * If cacheDir is set, clones are stored there and reused across runs.
 * A cached repo is updated with `git pull` instead of re-cloned.
 */
function countRepoLines(
  repoUrl: string,
  repoName: string,
  token: string,
  cacheDir: string,
): Map<string, { lines: number; colour: string }> {
  const useCache = cacheDir.length > 0;
  // Convert "Mearman/repo" to a safe directory name
  const safeName = repoName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const repoDir = useCache
    ? path.join(cacheDir, safeName)
    : fs.mkdtempSync(path.join(os.tmpdir(), "metrics-loc-"));

  try {
    const authedUrl = repoUrl.replace(
      "https://github.com",
      `https://x-access-token:${token}@github.com`,
    );

    if (useCache && fs.existsSync(path.join(repoDir, ".git"))) {
      // Repo already cached — pull latest
      try {
        execFileSync(
          "git",
          ["-C", repoDir, "fetch", "--depth", "1", "origin"],
          {
            stdio: "pipe",
            timeout: 30_000,
          },
        );
        execFileSync("git", ["-C", repoDir, "reset", "--hard", "FETCH_HEAD"], {
          stdio: "pipe",
          timeout: 10_000,
        });
      } catch {
        // Cache corrupted — remove and re-clone
        fs.rmSync(repoDir, { recursive: true, force: true });
        execFileSync("git", ["clone", "--depth", "1", authedUrl, repoDir], {
          stdio: "pipe",
          timeout: 60_000,
        });
      }
    } else {
      // Fresh clone
      if (useCache) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      execFileSync("git", ["clone", "--depth", "1", authedUrl, repoDir], {
        stdio: "pipe",
        timeout: 60_000,
      });
    }

    const langCounts = new Map<string, { lines: number; colour: string }>();
    walkDir(repoDir, langCounts);
    return langCounts;
  } finally {
    // Only clean up temp dirs (not cached ones)
    if (!useCache) {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }
  }
}

/**
 * Recursively walk a directory, counting lines in each file.
 */
function walkDir(
  dir: string,
  langCounts: Map<string, { lines: number; colour: string }>,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (shouldSkipDir(entry.name)) continue;
      walkDir(path.join(dir, entry.name), langCounts);
      continue;
    }

    if (!entry.isFile()) continue;

    const filePath = path.join(dir, entry.name);

    if (shouldSkip(filePath)) continue;

    const lang = detectLanguage(entry.name);
    let lineCount: number;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      lineCount = countLines(content);
    } catch {
      // Binary file, permission error, etc. — skip
      continue;
    }

    const existing = langCounts.get(lang.name);
    if (existing !== undefined) {
      existing.lines += lineCount;
    } else {
      langCounts.set(lang.name, { lines: lineCount, colour: lang.colour });
    }
  }
}

/**
 * Count lines in a string. Fast path for large files.
 */
function countLines(content: string): number {
  let count = 0;
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) count++; // '\n'
  }
  // Final line with no trailing newline
  if (content.length > 0 && content.charCodeAt(content.length - 1) !== 10) {
    count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export async function fetchLoc(
  api: {
    graphql(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<unknown>;
  },
  user: string,
  limit: number,
  explicitRepos: string[],
  token: string,
  reposConfig: ReposConfig,
  cacheDir: string,
): Promise<LocData> {
  // Resolve repo list
  let repos: { name: string; url: string; isPrivate: boolean }[];

  if (explicitRepos.length > 0) {
    repos = explicitRepos.map((r) => {
      const slashIndex = r.indexOf("/");
      const hasOwner = slashIndex !== -1;
      const ownerRepo = hasOwner ? r : `${user}/${r}`;
      return {
        name: hasOwner ? r.slice(slashIndex + 1) : r,
        url: `https://github.com/${ownerRepo}`,
        isPrivate: false,
      };
    });
  } else {
    const reposQuery = REPOS_QUERY.replace(
      "__PRIVACY__",
      repoPrivacyFilter(reposConfig),
    );
    const raw = await api.graphql(reposQuery, {
      login: user,
      first: limit,
    });
    const parsed = ResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(
        `Invalid GraphQL response for loc repos: ${parsed.error.message}`,
      );
    }

    repos = parsed.data.user.repositories.nodes.map((n) => ({
      name: n.nameWithOwner,
      url: n.url,
      isPrivate: n.isPrivate,
    }));
  }

  const results: RepoLoc[] = [];
  let totalLines = 0;

  for (const repo of repos) {
    try {
      const langMap = countRepoLines(repo.url, repo.name, token, cacheDir);
      const languages = [...langMap.entries()]
        .map(([name, { lines, colour }]) => ({ name, lines, colour }))
        .sort((a, b) => b.lines - a.lines);

      const repoTotal = languages.reduce((sum, l) => sum + l.lines, 0);

      if (repoTotal > 0) {
        results.push({
          name: repo.name,
          totalLines: repoTotal,
          isPrivate: repo.isPrivate,
          languages,
        });
        totalLines += repoTotal;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`LoC: failed to scan ${repo.name}: ${message}`);
    }
  }

  return { repos: results, totalLines };
}

// ---------------------------------------------------------------------------
// Data source
// ---------------------------------------------------------------------------

export const locSource: DataSource<LocConfig, LocData> = {
  id: "loc",
  configSchema: LocConfig,
  async fetch(ctx, config) {
    return await fetchLoc(
      ctx.api,
      ctx.user,
      config.limit,
      config.repositories,
      ctx.token,
      ctx.repos,
      config.cache_dir,
    );
  },
};
