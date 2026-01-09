import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import prettierPlugin from 'eslint-plugin-prettier';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      jsdoc: jsdoc,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '^assert$',
                '^buffer$',
                '^child_process$',
                '^cluster$',
                '^console$',
                '^constants$',
                '^crypto$',
                '^dgram$',
                '^dns$',
                '^domain$',
                '^events$',
                '^fs$',
                '^http$',
                '^https$',
                '^module$',
                '^net$',
                '^os$',
                '^path$',
                '^punycode$',
                '^querystring$',
                '^readline$',
                '^repl$',
                '^stream$',
                '^string_decoder$',
                '^sys$',
                '^timers$',
                '^tls$',
                '^tty$',
                '^url$',
                '^util$',
                '^vm$',
                '^zlib$',
              ],
              message:
                "Node.js built-in modules must be imported with the 'node:' prefix (e.g., 'node:fs' instead of 'fs').",
            },
          ],
        },
      ],
      complexity: 'off',
      'class-methods-use-this': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '^assert$',
                '^buffer$',
                '^child_process$',
                '^cluster$',
                '^console$',
                '^constants$',
                '^crypto$',
                '^dgram$',
                '^dns$',
                '^domain$',
                '^events$',
                '^fs$',
                '^http$',
                '^https$',
                '^module$',
                '^net$',
                '^os$',
                '^path$',
                '^punycode$',
                '^querystring$',
                '^readline$',
                '^repl$',
                '^stream$',
                '^string_decoder$',
                '^sys$',
                '^timers$',
                '^tls$',
                '^tty$',
                '^url$',
                '^util$',
                '^vm$',
                '^zlib$',
              ],
              message:
                "Node.js built-in modules must be imported with the 'node:' prefix (e.g., 'node:fs' instead of 'fs').",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/__tests__/**/*'],
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
  {
    ignores: [
      'test-output/**',
      'vitest.config.ts',
      'prettier.config.ts',
      'eslint.config.ts',
      '**/__fixtures__/**',
      'dist/**',
      'node_modules/**',
    ],
  },
];
