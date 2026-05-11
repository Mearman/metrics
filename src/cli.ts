#!/usr/bin/env node

/**
 * CLI entry point for metrics generation.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_... node src/cli.ts
 *   GITHUB_TOKEN=ghp_... node src/cli.ts --config path/to/config.yml
 *   GITHUB_TOKEN=ghp_... node src/cli.ts --user Mearman
 */

import { parseArgs } from "node:util";
import { loadConfig } from "./config/schema.ts";
import { runPipeline } from "./pipeline.ts";
import { createClient } from "./api/client.ts";

const { values } = parseArgs({
  options: {
    config: { type: "string" },
    user: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN environment variable is required.");
    process.exit(1);
  }

  const config = await loadConfig(values.config);

  // Resolve user: CLI flag > config > authenticated user from token
  let user = values.user ?? config.user;
  if (user === undefined) {
    const api = createClient(token);
    const response = await api.rest.users.getAuthenticated();
    user = response.data.login;
  }

  const configWithUser = { ...config, user };

  console.log(`Metrics: loaded config for user "${user}"`);

  const result = await runPipeline(configWithUser, token, {
    dryRun: values["dry-run"],
  });

  for (const output of result.outputs) {
    console.log(`  → ${output.path} (${String(output.byteSize)} bytes)`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
