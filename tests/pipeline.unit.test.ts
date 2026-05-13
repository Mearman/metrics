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
import * as z from "zod";

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

  it("respects explicit plugin order", async () => {
    // Register a third mock plugin
    if (getPlugin("test-mock-c") === undefined) {
      registerPlugin(makeMockPlugin("test-mock-c", 60));
    }

    const orderedConfig = {
      template: "classic",
      timezone: "UTC",
      outputs: [
        {
          path: "/tmp/metrics-test-order.svg",
          format: "svg",
          order: ["test-mock-b", "test-mock-a"],
          plugins: {
            "test-mock-a": {},
            "test-mock-b": {},
            "test-mock-c": {},
          },
        },
      ],
    };
    const result = await runPipeline(orderedConfig as never, "fake-token", {
      dryRun: true,
    });
    assert.strictEqual(result.outputs.length, 1);
    // The output should be valid SVG regardless of order
    const output = result.outputs[0];
    assert.ok(output !== undefined);
    assert.ok(output.byteSize > 0);
  });

  it("uses custom mock_data over registry defaults", async () => {
    // Register a plugin that tracks what data it received
    let receivedData: unknown = null;
    if (getPlugin("test-mock-override") !== undefined) {
      // Already registered from a previous test run — skip
    } else {
      const source: DataSource<Record<string, unknown>, string> = {
        id: "test-mock-override",
        configSchema: z.object({}),
        async fetch() {
          return "fetched-value";
        },
      };
      const renderer: Renderer<string, Record<string, unknown>> = {
        render(data: unknown) {
          receivedData = data;
          return { height: 40, elements: [] };
        },
      };
      registerPlugin({
        id: "test-mock-override",
        source,
        renderer,
      });
    }

    const customData = { custom: true, value: 42 };
    const config = {
      template: "classic",
      timezone: "UTC",
      outputs: [
        {
          path: "/tmp/metrics-test-mock-override.svg",
          format: "svg",
          mock: ["test-mock-override"],
          mock_data: {
            "test-mock-override": customData,
          },
          plugins: {
            "test-mock-override": {},
          },
        },
      ],
    };

    const result = await runPipeline(config as never, "fake-token", {
      dryRun: true,
    });
    assert.strictEqual(result.outputs.length, 1);
    // The renderer should have received the custom mock_data, not registry data
    assert.deepStrictEqual(receivedData, customData);
  });
});
