import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
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
    },
  },
);
