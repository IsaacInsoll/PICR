import { describe, expect, it } from 'vitest';
import {
  descendantPathPattern,
  escapeLikePattern,
} from '../../backend/helpers/descendantPathPattern';

describe('escapeLikePattern', () => {
  it('escapes LIKE wildcards and the escape character itself', () => {
    expect(escapeLikePattern('Smith_Wedding')).toBe('Smith\\_Wedding');
    expect(escapeLikePattern('100% Done')).toBe('100\\% Done');
    expect(escapeLikePattern('Before\\After')).toBe('Before\\\\After');
    expect(escapeLikePattern('_%\\')).toBe('\\_\\%\\\\');
  });

  it('leaves ordinary path characters untouched', () => {
    expect(escapeLikePattern('Clients/Smith Wedding (2024) [RAW]')).toBe(
      'Clients/Smith Wedding (2024) [RAW]',
    );
  });
});

describe('descendantPathPattern', () => {
  it('matches only paths strictly beneath the escaped folder path', () => {
    expect(descendantPathPattern('Clients/Smith_Wedding')).toBe(
      'Clients/Smith\\_Wedding/%',
    );
    expect(descendantPathPattern('Sales 50%')).toBe('Sales 50\\%/%');
  });
});
