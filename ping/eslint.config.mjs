import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import {
  picrCommonLinterOptions,
  picrCommonPlugins,
  picrCommonRules,
  picrRestrictedImports,
  picrTypeAwareAsyncRules,
  picrTypeScriptRules,
} from '../eslint/picr-eslint.mjs';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: ['dist', 'eslint.config.mjs'],
  },
  {
    linterOptions: picrCommonLinterOptions,
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['scripts/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: picrCommonPlugins,
    rules: {
      ...picrCommonRules,
      ...picrTypeScriptRules,
      ...picrTypeAwareAsyncRules,
      'no-restricted-imports': picrRestrictedImports([
        {
          group: ['../**/backend/**'],
          message: 'Do not import from backend. Move shared code to shared/.',
        },
        {
          group: ['../**/frontend/**'],
          message: 'Do not import from frontend. Move shared code to shared/.',
        },
        {
          group: ['../**/app/**'],
          message: 'Do not import from app. Move shared code to shared/.',
        },
      ]),
    },
  },
  {
    files: ['scripts/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
);
