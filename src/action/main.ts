/**
 * GitHub Action entry point for metrics generation.
 *
 * Reads config, fetches data, renders SVGs, writes output.
 * Runs via `node26` native TypeScript — no build step.
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { loadConfig } from "../config/schema.ts";
import { runPipeline } from "../pipeline.ts";

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

  core.setOutput("generated", String(result.outputs.length > 0));
}

run().catch((error: unknown) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  } else {
    core.setFailed(String(error));
  }
});
