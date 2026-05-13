import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import type { Rule } from "eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginZod from "eslint-plugin-zod";
import { configs } from "typescript-eslint";
import graphqlPlugin from "@graphql-eslint/eslint-plugin";

// ---------------------------------------------------------------------------
// Custom rules
// ---------------------------------------------------------------------------

/** Bans index.ts/index.js files — barrel files are an anti-pattern. */
const noIndexFiles: Rule.RuleModule = {
  meta: {
    type: "problem",
    messages: {
      noIndex:
        "Index files are banned. Rename '{{ filename }}' to something descriptive.",
    },
  },
  create(context) {
    const filename = context.filename;

    if (/(?:^|\/)index\.(?:ts|js|mts|mjs)$/.test(filename)) {
      context.report({
        loc: { line: 1, column: 0 },
        messageId: "noIndex",
        data: { filename },
      });
    }

    return {};
  },
};

/** Extract the exported name from an export specifier. */
function getExportedName(specifier: {
  exported: { type: string; name?: string; value?: string };
}): string {
  const e = specifier.exported;
  if (e.type === "Identifier" && e.name !== undefined) return e.name;
  if (e.value !== undefined) return e.value;
  return "unknown";
}

/**
 * Bans re-exports of any form.
 *
 * Catches:
 *   export * from "./module"
 *   export { foo } from "./module"
 *   export { default } from "./module"
 *   import { foo } from "./module"; export { foo }  (import-then-export)
 */
const noReexports: Rule.RuleModule = {
  meta: {
    type: "problem",
    messages: {
      starReexport:
        "Star re-exports are banned. Import and re-export specific names, or import directly from the source.",
      namedReexport:
        "Re-exports are banned. Import '{{ name }}' directly from its source module instead.",
      reexportWithoutSource:
        "Re-exporting imported identifiers is banned. Consumers should import '{{ name }}' directly from its source module.",
    },
  },
  create(context) {
    // Track identifiers that were imported (not locally defined)
    const importedIdentifiers = new Map<
      string,
      { source: string; node: Rule.Node }
    >();

    return {
      // Track imports: import { foo } from "./bar"
      ImportDeclaration(node) {
        if (
          node.source.type !== "Literal" ||
          typeof node.source.value !== "string"
        )
          return;
        const source: string = node.source.value;

        for (const specifier of node.specifiers) {
          importedIdentifiers.set(specifier.local.name, {
            source,
            node: specifier,
          });
        }
      },

      // Catch: export * from "./module"
      ExportAllDeclaration(node) {
        context.report({
          node,
          messageId: "starReexport",
        });
      },

      // Catch: export { foo } from "./module"
      // Catch: export { foo }  (where foo was imported)
      ExportNamedDeclaration(node) {
        // export { foo } from "./module" — re-export with source
        if (node.source !== null && node.source !== undefined) {
          for (const specifier of node.specifiers) {
            const name = getExportedName(specifier);
            context.report({
              node: specifier,
              messageId: "namedReexport",
              data: { name },
            });
          }
          return;
        }

        // export { foo } — check if foo was imported (not locally defined)
        for (const specifier of node.specifiers) {
          const localName = specifier.local.name;
          const imported = importedIdentifiers.get(localName);
          if (imported !== undefined) {
            const name = getExportedName(specifier);
            context.report({
              node: specifier,
              messageId: "reexportWithoutSource",
              data: { name },
            });
          }
        }
      },
    };
  },
};

/** Bans const x = y aliases where no transformation occurs. */
const noPointlessReassignments: Rule.RuleModule = {
  meta: {
    type: "problem",
    fixable: "code",
    messages: {
      pointlessReassignment:
        "Pointless reassignment: '{{ name }}' is just an alias for '{{ value }}'. Use the original directly.",
    },
    docs: {
      description:
        "Bans const x = y aliases where no transformation occurs — use the original identifier directly.",
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          node.id.type !== "Identifier" ||
          node.init?.type !== "Identifier" ||
          node.id.name.startsWith("_")
        ) {
          return;
        }

        if (
          node.parent.type !== "VariableDeclaration" ||
          node.parent.kind !== "const"
        ) {
          return;
        }

        const aliasName = node.id.name;
        const originalName = node.init.name;

        context.report({
          node,
          messageId: "pointlessReassignment",
          data: { name: aliasName, value: originalName },
          fix(fixer) {
            const scope = context.sourceCode.getScope(node);
            const variable = scope.set.get(aliasName);
            if (!variable) return null;

            const mutationRefs = variable.references.filter(
              (r) => r.isWrite() && r.identifier !== node.id,
            );
            if (mutationRefs.length > 0) return null;

            const readRefs = variable.references.filter((r) => r.isRead());

            const hasShorthand = readRefs.some((r) => {
              const afterToken = context.sourceCode.getTokenAfter(r.identifier);
              if (afterToken?.value === ":") return false;
              if (afterToken?.value !== "}" && afterToken?.value !== ",")
                return false;
              let tok = context.sourceCode.getTokenBefore(r.identifier);
              while (tok) {
                if (tok.value === "{") return true;
                if (tok.value === "[" || tok.value === "(") return false;
                if (tok.value === ":") return false;
                tok = context.sourceCode.getTokenBefore(tok);
              }
              return false;
            });
            if (hasShorthand) return null;

            const fixes = readRefs.map((r) =>
              fixer.replaceText(r.identifier, originalName),
            );

            const declaration = node.parent;
            if (
              declaration.type !== "VariableDeclaration" ||
              declaration.declarations.length !== 1
            ) {
              return null;
            }
            fixes.push(fixer.remove(declaration));
            return fixes;
          },
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Shared config
// ---------------------------------------------------------------------------

const configFiles = [
  "eslint.config.ts",
  "commitlint.config.ts",
  "release.config.ts",
  "lint-staged.config.ts",
];

const sharedPlugins = {
  custom: {
    rules: {
      "no-index-files": noIndexFiles,
      "no-pointless-reassignments": noPointlessReassignments,
      "no-reexports": noReexports,
    },
  },
  prettier: eslintPluginPrettier,
};

const sharedRules = {
  "custom/no-index-files": "error",
  "custom/no-pointless-reassignments": "error",
  "custom/no-reexports": "error",
  "prettier/prettier": "error",
  "@typescript-eslint/consistent-type-assertions": [
    "error",
    { assertionStyle: "never" },
  ],
};

// ---------------------------------------------------------------------------
// Exported config
// ---------------------------------------------------------------------------

export default defineConfig(
  { ignores: ["node_modules/"] },

  // Source and test files — type-checked via tsconfig.json
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...configs.strictTypeChecked,
      ...configs.stylisticTypeChecked,
      eslintPluginZod.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: sharedPlugins,
    rules: {
      ...sharedRules,
      "zod/consistent-schema-var-name": "off",
    },
  },

  // Test-specific overrides
  {
    files: ["tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/require-await": "off",
    },
  },

  // Config files — no tsconfig, use allowDefaultProject
  // Relax type-checked rules that clash with ESLint AST node handling
  {
    files: configFiles,
    extends: [
      eslint.configs.recommended,
      ...configs.strictTypeChecked,
      ...configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: configFiles },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: sharedPlugins,
    rules: {
      ...sharedRules,
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Disable inline config in source/test — all rules come from this file
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    linterOptions: {
      noInlineConfig: true,
    },
  },

  // Unavoidable type assertion: object → Record<string, unknown>
  // This is the single location where the cast is needed (TS object type
  // has no index signature). All property access on unknown values goes
  // through this utility.
  {
    files: ["src/util/props.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },

  eslintConfigPrettier,

  // ── GraphQL linting ──────────────────────────────────────────────────
  // Extract GraphQL queries from /* GraphQL */-tagged template literals
  // in TypeScript source files, then validate them against the GitHub
  // schema. Catches unused variables, unknown fields, type mismatches.
  {
    files: ["src/**/*.ts"],
    processor: graphqlPlugin.processor,
  },
  {
    files: ["**/*.graphql"],
    languageOptions: {
      parser: graphqlPlugin.parser,
      parserOptions: {
        graphQLConfig: {
          schema: "graphql-schema.json",
        },
      },
    },
    plugins: {
      "@graphql-eslint": graphqlPlugin,
    },
    rules: {
      ...graphqlPlugin.configs["flat/operations-recommended"].rules,
      // Our queries are anonymous — this is fine for inline template literals
      "@graphql-eslint/no-anonymous-operations": "off",
      // Naming convention doesn't suit our query-per-plugin style
      "@graphql-eslint/naming-convention": "off",
      // These rules require sibling documents config (cross-file analysis)
      "@graphql-eslint/require-selections": "off",
      "@graphql-eslint/no-unused-fragments": "off",
      "@graphql-eslint/known-fragment-names": "off",
      "@graphql-eslint/no-fragment-cycles": "off",
      // Compatibility issue with ESLint flat config
      "@graphql-eslint/fields-on-correct-type": "off",
    },
  },
);
