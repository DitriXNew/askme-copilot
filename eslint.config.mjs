import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 6,
      sourceType: 'module',
    },
    rules: {
      'curly': 'warn',
      'eqeqeq': 'warn',
      'no-throw-literal': 'warn'
    },
  },
  {
    ignores: ['out/**', 'dist/**', '**/*.d.ts', 'node_modules/**']
  }
];