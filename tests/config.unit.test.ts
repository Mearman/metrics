import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config/schema.ts";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const TMP_DIR = join(import.meta.dirname, "__test_tmp__");

describe("Config loading", () => {
  it("loads a valid YAML config with plugins", async () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const configPath = join(TMP_DIR, "test-metrics.yml");
    writeFileSync(
      configPath,
      `
outputs:
  - path: output/test.svg
    format: svg
    plugins:
      languages:
        limit: 5
`,
    );

    try {
      const config = await loadConfig(configPath);
      assert.ok(config.outputs);
      assert.strictEqual(config.outputs.length, 1);
      const output = config.outputs[0];
      assert.ok(output !== undefined);
      assert.strictEqual(output.path, "output/test.svg");
      assert.strictEqual(output.format, "svg");
      assert.ok(output.plugins?.languages);
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it("throws on missing config file", async () => {
    await assert.rejects(
      () => loadConfig("/nonexistent/path.yml"),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("ENOENT") ||
            err.message.includes("No metrics config found"),
        );
        return true;
      },
    );
  });

  it("throws on config with no outputs", async () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const configPath = join(TMP_DIR, "bad-metrics.yml");
    writeFileSync(configPath, "user: test\n");

    try {
      await assert.rejects(() => loadConfig(configPath));
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it("applies user override when config has no user", async () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const configPath = join(TMP_DIR, "override-metrics.yml");
    writeFileSync(
      configPath,
      `
outputs:
  - path: output/test.svg
    plugins: {}
`,
    );

    try {
      const config = await loadConfig(configPath, { user: "OverrideUser" });
      assert.strictEqual(config.user, "OverrideUser");
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it("does not override user if already set in config", async () => {
    mkdirSync(TMP_DIR, { recursive: true });
    const configPath = join(TMP_DIR, "nooverride-metrics.yml");
    writeFileSync(
      configPath,
      `
user: ConfigUser
outputs:
  - path: output/test.svg
    plugins: {}
`,
    );

    try {
      const config = await loadConfig(configPath, { user: "OverrideUser" });
      assert.strictEqual(config.user, "ConfigUser");
    } finally {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });
});
