// Shared ESLint config module for subsystem configs.
// This intentionally lives under eslint/ instead of repo-root eslint.config.mjs
// because backend/shared/frontend/app still have their own runnable entry configs.
// The app must keep eslint-config-expo as its base, and each subsystem adds local rules on top.
import importPlugin from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';

export const picrCommonLinterOptions = {
  reportUnusedDisableDirectives: 'error',
};

export const picrCommonPlugins = {
  import: importPlugin,
  'unused-imports': unusedImports,
};

export const picrRestrictedSyntaxRules = [
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
];

export const picrCommonRules = {
  'no-console': 'warn',
  'import/no-duplicates': 'error',
  'import/newline-after-import': 'error',
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
  'no-restricted-syntax': ['error', ...picrRestrictedSyntaxRules],
};

export const picrTypeScriptRules = {
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-explicit-any': 'error',
  'prefer-const': 'error',
};

export const picrRestrictedImports = (patterns) => [
  'error',
  {
    patterns,
  },
];
