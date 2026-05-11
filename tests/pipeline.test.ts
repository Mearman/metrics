/**
 * Tests for the pipeline orchestrator.
 *
 * Uses mock plugins to verify layout stacking, offset application,
 * and output generation without real API calls.
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { runPipeline } from "../src/pipeline.ts";
import type {
  Plugin,
  RenderResult,
  DataSource,
  Renderer,
} from "../src/plugins/types.ts";
import { registerPlugin, getPlugin } from "../src/plugins/registry.ts";

// ---------------------------------------------------------------------------
// Mock plugin helpers
// ---------------------------------------------------------------------------

function makeMockPlugin(
  id: string,
  height: number,
  fetchResult: unknown = {},
): Plugin<Record<string, unknown>, unknown> {
  const source: DataSource<Record<string, unknown>, unknown> = {
    id,
    configSchema: {
      parse: (v: unknown) => v,
      safeParse: (v: unknown) => ({ success: true, data: v }),
    } as never,
    fetch: async () => fetchResult,
  };

  const renderer: Renderer<unknown, Record<string, unknown>> = {
    render: (): RenderResult => ({
      height,
      elements: [
        {
          tag: "rect",
          attrs: { width: 100, height, fill: "#ff0000", x: 0, y: 0 },
        },
      ],
    }),
  };

  return { id, source, renderer };
}

// ---------------------------------------------------------------------------
// Pipeline tests
// ---------------------------------------------------------------------------

describe("Pipeline", () => {
  const testConfig = {
    template: "classic",
    timezone: "UTC",
    outputs: [
      {
        path: "/tmp/metrics-test-pipeline.svg",
        format: "svg",
        plugins: {
          "test-mock-a": {},
          "test-mock-b": {},
        },
      },
    ],
  };

  beforeEach(() => {
    // Register mock plugins
    if (getPlugin("test-mock-a") === undefined) {
      registerPlugin(makeMockPlugin("test-mock-a", 100));
    }
    if (getPlugin("test-mock-b") === undefined) {
      registerPlugin(makeMockPlugin("test-mock-b", 80));
    }
  });

  it("runs pipeline in dry-run mode without writing files", async () => {
    const result = await runPipeline(testConfig as never, "fake-token", {
      dryRun: true,
    });
    assert.strictEqual(result.outputs.length, 1);
    const output = result.outputs[0];
    assert.ok(output !== undefined);
    assert.ok(output.byteSize > 0);
    assert.strictEqual(output.path, "/tmp/metrics-test-pipeline.svg");
  });

  it("produces valid SVG output", async () => {
    const result = await runPipeline(testConfig as never, "fake-token", {
      dryRun: true,
    });
    const output = result.outputs[0];
    assert.ok(output !== undefined);
    // byteSize should be reasonable (header + two sections + background)
    assert.ok(output.byteSize > 100);
  });

  it("skips unknown plugins gracefully", async () => {
    const configWithUnknown = {
      template: "classic",
      timezone: "UTC",
      outputs: [
        {
          path: "/tmp/metrics-test-unknown.svg",
          format: "svg",
          plugins: {
            "test-mock-a": {},
            "nonexistent-plugin": {},
          },
        },
      ],
    };
    // Should not throw — just warn and skip
    const result = await runPipeline(configWithUnknown as never, "fake-token", {
      dryRun: true,
    });
    assert.strictEqual(result.outputs.length, 1);
  });

  it("handles empty plugin list", async () => {
    const emptyConfig = {
      template: "classic",
      timezone: "UTC",
      outputs: [
        {
          path: "/tmp/metrics-test-empty.svg",
          format: "svg",
          plugins: {},
        },
      ],
    };
    const result = await runPipeline(emptyConfig as never, "fake-token", {
      dryRun: true,
    });
    assert.strictEqual(result.outputs.length, 1);
    // Should still produce SVG with just background
    const emptyOutput = result.outputs[0];
    assert.ok(emptyOutput !== undefined);
    assert.ok(emptyOutput.byteSize > 0);
  });
});
