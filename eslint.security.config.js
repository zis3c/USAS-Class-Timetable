import js from '@eslint/js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import noUnsanitizedPlugin from 'eslint-plugin-no-unsanitized';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const securityRules = {
  ...js.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  ...tsPlugin.configs['flat/strict-type-checked'][2].rules,
  ...securityPlugin.configs.recommended.rules,
  ...sonarjsPlugin.configs.recommended.rules,
  ...noUnsanitizedPlugin.configs['recommended-legacy'].rules,
  'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  'no-empty': 'off',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-undef': 'off',
  'react-hooks/purity': 'off',
  'react-hooks/set-state-in-effect': 'off',
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
  'no-unused-vars': 'off',
};

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', '**/*.config.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
        tsconfigRootDir: projectRoot,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security: securityPlugin,
      sonarjs: sonarjsPlugin,
      'no-unsanitized': noUnsanitizedPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: securityRules,
  },
];
