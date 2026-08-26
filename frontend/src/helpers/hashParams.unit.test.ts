import { describe, expect, test } from 'vitest';
import { readHashParam, withHashParam } from './hashParams';

describe('hash parameters', () => {
  test('reads a parameter without exposing the hash prefix', () => {
    expect(readHashParam('#s=date-desc&v=l', 'v')).toBe('l');
    expect(readHashParam('#s=date-desc', 'v')).toBeUndefined();
  });

  test('updates one parameter without dropping its neighbours', () => {
    expect(withHashParam('#s=date-desc&v=l', 'm', 'info-42')).toBe(
      '#s=date-desc&v=l&m=info-42',
    );
    expect(withHashParam('#s=date-desc&v=l&m=info-42', 'm')).toBe(
      '#s=date-desc&v=l',
    );
  });
});
