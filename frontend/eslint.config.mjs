import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    settings: {
      react: { version: 'detect' },
    },
    plugins: {
      import: importPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
      'react/prop-types': 'off',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unescaped-entities': 'off',
      'no-console': 'warn',
      radix: 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 8,
        },
      ],
      'react/no-array-index-key': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../**/backend/**'],
              message:
                'Do not import from backend. Move shared code to shared/.',
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
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TSPropertySignature[key.name='metadata'] TSTypeReference[typeName.name='Record']",
          message:
            'Use PicrMetadataMap from @shared/types/metadata for metadata maps instead of ad-hoc Record types.',
        },
        {
          selector:
            "TSAsExpression[expression.type='TSAsExpression'][expression.typeAnnotation.type='TSUnknownKeyword']",
          message:
            'Avoid double assertions (`as unknown as`). Fix the type or add a typed adapter.',
        },
      ],
    },
  },
);
