import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import i18next from 'eslint-plugin-i18next';
import {
  picrCommonLinterOptions,
  picrCommonPlugins,
  picrCommonRules,
  picrRestrictedImports,
  picrRestrictedSyntaxRules,
  picrTypeAwareAsyncRules,
  picrTypeScriptRules,
} from '../eslint/picr-eslint.mjs';

const notificationLiteralRule = {
  selector:
    "CallExpression[callee.object.name='notifications'][callee.property.name='show'] > ObjectExpression > Property[key.name=/^(title|message)$/] > Literal",
  message: 'Notification title/message must come from t().',
};

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    ignores: ['eslint.config.mjs'],
  },
  {
    linterOptions: picrCommonLinterOptions,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      ...picrCommonPlugins,
      i18next,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...picrCommonRules,
      ...picrTypeScriptRules,
      ...picrTypeAwareAsyncRules,
      'react-hooks/capitalized-calls': 'error',
      'react/prop-types': 'off',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unescaped-entities': 'off',
      'react/no-array-index-key': 'warn',
      'i18next/no-literal-string': [
        'error',
        {
          framework: 'react',
          mode: 'jsx-only',
          'jsx-attributes': {
            include: [
              'alt',
              'aria-label',
              'description',
              'label',
              'message',
              'nothingFoundMessage',
              'placeholder',
              'title',
            ],
          },
          'object-properties': {
            exclude: ['[A-Z_-]+', 'labelKey'],
          },
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...picrRestrictedSyntaxRules,
        notificationLiteralRule,
      ],
      'no-restricted-imports': picrRestrictedImports([
        {
          group: ['../**/backend/**'],
          message: 'Do not import from backend. Move shared code to shared/.',
        },
        {
          group: ['../**/app/**'],
          message: 'Do not import from app. Move shared code to shared/.',
        },
        {
          group: ['../**/shared/**'],
          message:
            'Do not use relative imports to shared/. Use @shared/* imports instead.',
        },
        {
          group: [
            '../types',
            '../types.*',
            '../../types',
            '../../types.*',
            '../../../types',
            '../../../types.*',
            '../../../../types',
            '../../../../types.*',
            '../../../../../types',
            '../../../../../types.*',
          ],
          message:
            'Do not import frontend root types. Use @shared/types/picr or other shared/types modules.',
        },
      ]),
    },
  },
  {
    files: ['src/components/DevBackendOverrideBanner.tsx'],
    rules: {
      'i18next/no-literal-string': 'off',
    },
  },
);
