/**
 * Pipeline orchestrator — config → fetch → render → write.
 *
 * This is the core of the metrics generator. It:
 * 1. Loads config via cosmiconfig
 * 2. Creates an authenticated API client
 * 3. For each output, fetches plugin data, renders SVG, writes file
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { RootConfig } from "./config/schema.ts";
import { createClient } from "./api/client.ts";
import { serialise } from "./render/svg/serialise.ts";
import { svg } from "./render/svg/builder.ts";
import type { SvgElement } from "./render/svg/builder.ts";

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface PipelineResult {
  outputs: OutputResult[];
}

export interface OutputResult {
  path: string;
  byteSize: number;
}

/**
 * Run the full metrics generation pipeline.
 *
 * @param config  - Validated root config
 * @param token   - GitHub token for API access
 * @param options - Dry-run mode suppresses file writes
 */
export async function runPipeline(
  config: RootConfig,
  token: string,
  options?: { dryRun?: boolean },
): Promise<PipelineResult> {
  const _api = createClient(token);
  const dryRun = options?.dryRun ?? false;
  const results: OutputResult[] = [];

  for (const output of config.outputs) {
    const sections: SvgElement[] = [];
    const totalHeight = 0;

    // TODO: For each plugin in output.plugins, resolve the DataSource and Renderer,
    // call source.fetch(), then renderer.render(), collect sections.
    void _api;

    // Wrap in root SVG element
    const width = 480;
    const height = Math.max(totalHeight, 1);
    const root = svg(
      {
        xmlns: "http://www.w3.org/2000/svg",
        width,
        height,
        viewBox: `0 0 ${String(width)} ${String(height)}`,
        role: "img",
        "aria-label": `Metrics for ${config.user ?? "unknown"}`,
      },
      ...sections,
    );

    const svgContent = serialise(root);

    if (!dryRun) {
      await mkdir(dirname(output.path), { recursive: true });
      await writeFile(output.path, svgContent, "utf-8");
    }

    results.push({
      path: output.path,
      byteSize: new TextEncoder().encode(svgContent).byteLength,
    });
  }

  return { outputs: results };
}
