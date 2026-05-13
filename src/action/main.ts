/**
 * GitHub Action entry point for metrics generation.
 *
 * Reads config, fetches data, renders SVGs, writes output.
 * Runs via `node26` native TypeScript — no build step.
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { loadConfig } from "../config/schema.ts";
import { runPipeline } from "../pipeline.ts";
import { generateIndex } from "../output/gallery.ts";

async function run(): Promise<void> {
  const configPath = core.getInput("config") || undefined;
  const token = core.getInput("token");
  const dryRun = core.getBooleanInput("dry-run");

  const config = await loadConfig(configPath, {
    user: github.context.repo.owner,
  });

  const userDisplay = config.user ?? "unknown";
  core.info(`Generating metrics for user "${userDisplay}"`);

  const result = await runPipeline(config, token, { dryRun });

  for (const output of result.outputs) {
    core.info(`  → ${output.path} (${String(output.byteSize)} bytes)`);
  }

  // Generate index.html gallery page
  const indexPath = "output/index.html";
  const html = generateIndex(result.outputs, config.user ?? "unknown");
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, html, "utf-8");
  core.info(`  → ${indexPath}`);

  core.setOutput("generated", String(result.outputs.length > 0));
}

run().catch((error: unknown) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  } else {
    core.setFailed(String(error));
  }
});
