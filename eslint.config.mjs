import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import vitest from "eslint-plugin-vitest";
import importPlugin from "eslint-plugin-import";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";

export default tseslint.config(
  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Prettier config (must be last to override formatting rules)
  prettier,

  // Global configurations
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // TypeScript files configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      import: importPlugin,
      jsdoc: jsdoc,
    },
    rules: {
      // TypeScript-specific rule overrides
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Import rules
      "import/no-unresolved": "off",
      "import/extensions": "off",

      // General rules
      complexity: "off",
      "class-methods-use-this": "off",
    },
  },

  // JavaScript files configuration
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-unresolved": "off",
      "import/extensions": "off",
    },
  },

  // Vitest test files configuration
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.test.js",
      "**/__tests__/**/*",
    ],
    plugins: {
      vitest: vitest,
    },
    languageOptions: {
      globals: {
        ...globals.vitest,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },

  // Ignore patterns
  {
    ignores: [
      "vitest.config.ts",
      "**/__fixtures__/**",
      "dist/**",
      "node_modules/**",
    ],
  },
);
