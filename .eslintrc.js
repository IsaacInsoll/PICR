module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-refresh', 'react-compiler'],
  rules: {
    'react-compiler/react-compiler': 'error',
    'no-console': 'warn',
    'react-refresh/only-export-components': 'error',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react/destructuring-assignment': ['error', 'always'],
    'react/no-unescaped-entities': 'error',
  },
};
