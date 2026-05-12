import type { UserConfig } from "@commitlint/types";

/**
 * Commitlint configuration for metrics.
 *
 * Enforces conventional commits with scoped enums matching the module structure.
 * Commits must use British English spelling and grammar.
 */
const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        // Source modules
        "action",
        "api",
        "config",
        "loc",
        "plugins",
        "render",
        "output",
        "utils",
        // Build/tooling
        "build",
        "release",
        "ci",
        "deps",
      ],
    ],
  },
};

export default config;
