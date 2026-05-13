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
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { loadConfig } from "./config/schema.ts";
import { runPipeline } from "./pipeline.ts";
import { createClient } from "./api/client.ts";
import { generateIndex } from "./output/gallery.ts";

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

    // Write robots.txt alongside the SVG to prevent search engine indexing
    const outputDir = dirname(output.path);
    const robotsPath = join(outputDir, "robots.txt");
    await mkdir(outputDir, { recursive: true });
    await writeFile(robotsPath, "User-agent: *\nDisallow: /\n", "utf-8");
  }

  // Generate index.html gallery page
  const indexPath = "output/index.html";
  const html = generateIndex(result.outputs, configWithUser.user);
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, html, "utf-8");
  console.log(`  → ${indexPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
