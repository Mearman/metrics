#!/usr/bin/env node

/**
 * CLI entry point for metrics generation.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_... node src/index.ts
 *   GITHUB_TOKEN=ghp_... node src/index.ts --config path/to/config.yml
 */

import { parseArgs } from "node:util";
import { loadConfig } from "./config/schema.ts";

const { values } = parseArgs({
  options: {
    config: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
  strict: true,
});

async function main(): Promise<void> {
  const config = await loadConfig(values.config);

  const userDisplay = config.user ?? "unknown";
  console.log(`Metrics: loaded config for user "${userDisplay}"`);
  console.log(`Outputs: ${String(config.outputs.length)}`);
  console.log(
    `Plugins: ${config.outputs.flatMap((o) => Object.keys(o.plugins)).join(", ")}`,
  );

  // TODO: Implement fetch → render → write pipeline
  console.log("Pipeline not yet implemented.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
