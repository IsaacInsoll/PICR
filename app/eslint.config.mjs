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
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
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
          ],
        },
      ],
    },
  },
]);
