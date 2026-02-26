import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
      radix: 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 8,
        },
      ],
      'prefer-const': 'error',
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
              group: ['../**/app/**'],
              message: 'Do not import from app. Move shared code to shared/.',
            },
            {
              group: ['../**/backend/**'],
              message:
                'Do not import from backend. Move shared code to shared/.',
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
  {
    files: ['gql/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
