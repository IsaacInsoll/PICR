import { expect, test } from 'vitest';
import type { CombinedError } from 'urql';
import { AUTH_REASON } from '../../shared/auth/authErrorContract';
import { classifyGlobalUrqlError } from '../../shared/urql/errorClassification';

const makeError = (value: Partial<CombinedError>) => value as CombinedError;

test('classifies network transport failures as global network errors', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[Network] Failed to fetch',
      networkError: new Error('Failed to fetch'),
      graphQLErrors: [],
    }),
  );

  expect(match).toEqual({
    type: 'network_unavailable',
    diagnosticMessage: '[Network] Failed to fetch',
  });
});

test('does not classify transport failures from English message text alone', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[Network] Failed to fetch',
      graphQLErrors: [],
    }),
  );

  expect(match).toBeNull();
});

test('classifies forbidden auth reasons as global permission errors', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[GraphQL] Access denied',
      graphQLErrors: [
        {
          message: 'Access denied',
          extensions: { code: 'FORBIDDEN', reason: AUTH_REASON.ACCESS_DENIED },
        } as never,
      ],
    }),
  );

  expect(match).toEqual({
    type: 'no_permissions',
    reason: AUTH_REASON.ACCESS_DENIED,
    diagnosticMessage: '[GraphQL] Access denied',
  });
});

test('classifies forbidden errors without a known reason using a generic incident', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[GraphQL] A future permission error',
      graphQLErrors: [
        {
          message: 'A future permission error',
          extensions: { code: 'FORBIDDEN', reason: 'FUTURE_REASON' },
        } as never,
      ],
    }),
  );

  expect(match).toEqual({
    type: 'no_permissions',
    diagnosticMessage: '[GraphQL] A future permission error',
  });
});

test('does not classify legacy permission message text without metadata', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[GraphQL] Access denied',
      graphQLErrors: [
        {
          message: 'Access denied',
          extensions: {},
        } as never,
      ],
    }),
  );

  expect(match).toBeNull();
});

test('does not create overlay for not-logged-in auth errors', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[GraphQL] Not logged in',
      graphQLErrors: [
        {
          message: 'Not logged in',
          extensions: {
            code: 'UNAUTHENTICATED',
            reason: AUTH_REASON.NOT_LOGGED_IN,
          },
        } as never,
      ],
    }),
  );

  expect(match).toBeNull();
});

test('does not create overlay for bad user input auth reasons', () => {
  const match = classifyGlobalUrqlError(
    makeError({
      message: '[GraphQL] Hero image does not exist',
      graphQLErrors: [
        {
          message: 'Hero image does not exist',
          extensions: {
            code: 'BAD_USER_INPUT',
            reason: AUTH_REASON.INVALID_HERO_IMAGE,
          },
        } as never,
      ],
    }),
  );

  expect(match).toBeNull();
});
