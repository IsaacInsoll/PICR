import { describe, expect, it } from 'vitest';
import { stripUrqlErrorPrefixes } from '../../shared/urql/stripUrqlErrorPrefixes';

describe('stripUrqlErrorPrefixes', () => {
  it.each([
    ['[GraphQL] Permission denied', 'Permission denied'],
    ['[Network] Connection refused', 'Connection refused'],
    [
      '[GraphQL] First error\n[GraphQL] Second error',
      'First error\nSecond error',
    ],
    ['[Network] [GraphQL] Request failed', 'Request failed'],
    [
      'Diagnostic containing [Network] detail',
      'Diagnostic containing [Network] detail',
    ],
  ])('strips only leading URQL transport prefixes', (message, expected) => {
    expect(stripUrqlErrorPrefixes(message)).toBe(expected);
  });
});
