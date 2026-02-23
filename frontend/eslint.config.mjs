import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import reactCompiler from 'eslint-plugin-react-compiler';

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
      'react-compiler': reactCompiler,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unescaped-entities': 'off',
      'no-console': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
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
          ],
        },
      ],
    },
  },
);
