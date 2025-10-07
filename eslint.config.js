const eslintPluginPrettier = require('eslint-plugin-prettier');
const eslintConfigPrettier = require('eslint-config-prettier');
const typescriptEslintParser = require('@typescript-eslint/parser');
const typescriptEslintPlugin = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    files: ['**/*.ts'],
    ignores: ['dist/**', 'node_modules/**'],
    languageOptions: {
      parser: typescriptEslintParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintPlugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      ...typescriptEslintPlugin.configs.recommended.rules,
      'prettier/prettier': 'error',
    },
  },
];
