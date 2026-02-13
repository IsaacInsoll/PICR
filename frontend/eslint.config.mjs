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
      'react-compiler/react-compiler': 'warn',
      'no-console': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
      'prefer-spread': 'warn',
      'no-empty': 'warn',
      'react/jsx-key': 'warn',
      'react/jsx-no-target-blank': 'warn',
      'no-unsafe-optional-chaining': 'warn',
      'no-sparse-arrays': 'warn',
      'prefer-const': 'warn',
      'react/destructuring-assignment': ['error', 'always'],
      'react/no-unescaped-entities': 'off',
    },
  },
);
