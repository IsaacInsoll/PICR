// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';

export default defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      radix: 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
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
              group: ['../**/frontend/**'],
              message:
                'Do not import from frontend. Move shared code to shared/.',
            },
            {
              group: ['../**/backend/**'],
              message:
                'Do not import from backend. Move shared code to shared/.',
            },
            {
              group: ['../**/shared/**'],
              message:
                'Do not use relative imports to shared/. Use @shared/* imports instead.',
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
]);
