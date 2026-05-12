/**
 * Code plugin — data source.
 *
 * Fetches a random code snippet from the user's recent push events.
 * Uses the REST API with full Zod validation — no `as` casts,
 * no direct property access on unvalidated data.
 */

import * as z from "zod";
import type { ApiClient } from "../types.ts";

export const CodeConfig = z.object({
  /** Maximum characters for the code snippet */
  max_length: z.int().min(20).max(500).default(200),
  /** Number of recent commits to scan */
  scan_limit: z.int().min(1).max(50).default(20),
  /** Events maximum age in days (0 = no limit) */
  days: z.int().min(0).max(365).default(3),
  /** Only show snippets from these languages (empty = all) */
  languages: z.array(z.string().trim()).default([]),
  /** Event visibility: public only or all (requires repo scope) */
  visibility: z.enum(["public", "all"]).default("public"),
});
export type CodeConfig = z.infer<typeof CodeConfig>;

export interface CodeSnippet {
  /** The repository the code comes from */
  repository: string;
  /** The file path */
  file: string;
  /** The code snippet text */
  code: string;
  /** Programming language (from file extension) */
  language: string;
  /** Commit message */
  message: string;
}

export interface CodeData {
  snippet: CodeSnippet | null;
}

// ---------------------------------------------------------------------------
// Zod schemas — single source of truth for REST response validation
// ---------------------------------------------------------------------------

const EXTENSION_MAP: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  rs: "Rust",
  go: "Go",
  rb: "Ruby",
  java: "Java",
  kt: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  h: "C",
  cs: "C#",
  scala: "Scala",
  sh: "Shell",
  yml: "YAML",
  yaml: "YAML",
  json: "JSON",
  sql: "SQL",
  md: "Markdown",
};

/** Schema for a commit inside a PushEvent payload. */
const CommitSchema = z.object({
  url: z.url(),
  message: z.string().trim(),
});

/** Schema for the push event payload — only fields we need. */
const PushPayloadSchema = z.object({
  commits: z.array(CommitSchema).min(1),
});

/** Schema for a single REST event from listPublicEventsForUser. */
const EventSchema = z.object({
  type: z.string().trim(),
  created_at: z.string().trim().optional(),
  payload: PushPayloadSchema,
});

/** Schema for a file in a commit diff response. */
const CommitFileSchema = z.object({
  filename: z.string().trim(),
  patch: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

/** Schema for the repos.getCommit response — only the fields we need. */
const CommitResponseSchema = z.object({
  files: z.array(CommitFileSchema).optional(),
});

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * Fetch a random code snippet from recent commits.
 */
export async function fetchCode(
  api: ApiClient,
  user: string,
  config: CodeConfig,
): Promise<CodeData> {
  const maxAge =
    config.days > 0
      ? new Date(Date.now() - config.days * 24 * 60 * 60 * 1000)
      : undefined;
  const languageSet = new Set(config.languages.map((l) => l.toLowerCase()));

  const response = await api.rest.activity.listPublicEventsForUser({
    username: user,
    per_page: 100,
  });

  // Validate every event through Zod — reject non-push and malformed events
  const pushEvents = response.data
    .map((raw) => EventSchema.safeParse(raw))
    .filter((r) => r.success)
    .map((r) => r.data)
    .filter((event) => {
      if (maxAge === undefined) return true;
      if (event.created_at === undefined) return true;
      return new Date(event.created_at) >= maxAge;
    })
    .sort(() => Math.random() - 0.5)
    .slice(0, config.scan_limit);

  for (const event of pushEvents) {
    const commit = event.payload.commits[0];
    if (commit === undefined) continue;

    // Extract owner/repo/sha from the commit API URL
    // Format: https://api.github.com/repos/{owner}/{repo}/commits/{sha}
    const urlParts = commit.url.split("/");
    const repoOwner = urlParts[5];
    const repoName = urlParts[6];
    const commitSha = urlParts[urlParts.length - 1];
    if (
      repoOwner === undefined ||
      repoName === undefined ||
      commitSha === undefined
    )
      continue;

    const fullRepoName = `${repoOwner}/${repoName}`;

    try {
      const commitResponse = await api.rest.repos.getCommit({
        owner: repoOwner,
        repo: repoName,
        ref: commitSha,
      });

      // Validate the commit response through Zod
      const parsed = CommitResponseSchema.safeParse(commitResponse.data);
      if (!parsed.success) continue;

      const files = parsed.data.files;
      if (files === undefined) continue;

      // Filter to code files (not removed, not generated, not lockfiles)
      const codeFiles = files.filter((f) => {
        if (f.patch === undefined) return false;
        if (f.status === "removed") return false;
        const name = f.filename.toLowerCase();
        if (
          name.includes("lock") ||
          name.includes("generated") ||
          name.includes(".min.")
        )
          return false;
        return true;
      });

      if (codeFiles.length === 0) continue;

      // Pick a random file
      const file = codeFiles[Math.floor(Math.random() * codeFiles.length)];
      if (file?.patch === undefined) continue;

      // Extract added lines from the patch
      const addedLines = file.patch
        .split("\n")
        .filter(
          (line: string) => line.startsWith("+") && !line.startsWith("+++"),
        )
        .map((line: string) => line.slice(1))
        .filter((line: string) => line.trim().length > 0)
        .filter((line: string) => !line.trim().startsWith("//"))
        .filter((line: string) => !line.trim().startsWith("#"))
        .filter((line: string) => line.trim().length > 3);

      if (addedLines.length === 0) continue;

      // Combine lines into snippet, respecting max_length
      let snippet = "";
      for (const line of addedLines) {
        const next = snippet.length === 0 ? line : `${snippet}\n${line}`;
        if (next.length > config.max_length) break;
        snippet = next;
      }

      if (snippet.length === 0) continue;

      const ext = file.filename.includes(".")
        ? (file.filename.split(".").pop() ?? "")
        : "";
      const language =
        ext.length > 0 ? (EXTENSION_MAP[ext] ?? ext.toUpperCase()) : "Text";

      // Filter by configured languages
      if (languageSet.size > 0 && !languageSet.has(language.toLowerCase()))
        continue;

      const message = commit.message.split("\n")[0] ?? "";

      return {
        snippet: {
          repository: fullRepoName,
          file: file.filename,
          code: snippet,
          language,
          message,
        },
      };
    } catch {
      // Commit fetch failed — try next event
      continue;
    }
  }

  return { snippet: null };
}
