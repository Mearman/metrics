/**
 * GitHub Action entry point for metrics generation.
 *
 * Reads config, fetches data, renders SVGs, writes output.
 * Runs via `node26` native TypeScript — no build step.
 */

import * as core from "@actions/core";
import * as github from "@actions/github";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../config/schema.ts";

async function run(): Promise<void> {
  const configPath = core.getInput("config");
  const _token = core.getInput("token");
  const dryRun = core.getBooleanInput("dry-run");

  const raw = await readFile(resolve(configPath), "utf-8");
  const config = loadConfig(raw, {
    user: github.context.repo.owner,
  });

  const userDisplay = config.user ?? "unknown";
  core.info(`Generating metrics for user "${userDisplay}"`);
  core.info(`Outputs: ${String(config.outputs.length)}`);
  core.info(`Dry run: ${String(dryRun)}`);

  // TODO: Implement fetch → render → write pipeline
  void _token;
  core.warning("Pipeline not yet implemented.");

  core.setOutput("generated", "false");
}

run().catch((error: unknown) => {
  if (error instanceof Error) {
    core.setFailed(error.message);
  } else {
    core.setFailed(String(error));
  }
});
