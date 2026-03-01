const { FlatCompat } = require('@eslint/eslintrc');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: require('eslint:recommended'),
});

module.exports = [
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '**/*.test.ts'],
  },
  ...compat.extends('eslint:recommended'),
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
];

