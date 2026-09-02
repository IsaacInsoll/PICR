import { describe, expect, test } from 'vitest';
import {
  buildFileModalNavigation,
  fileModalHistoryState,
  parseFileModalHash,
  parseFileModalState,
  serializeFileModalState,
  wasFileModalOpenedInCurrentDocument,
  withFileModalState,
} from './fileModalHash';

describe('file modal URL state', () => {
  test('round trips comment state including a highlight', () => {
    const state = {
      mode: 'comments' as const,
      fileId: '42',
      highlight: '108',
    };
    expect(parseFileModalState(serializeFileModalState(state))).toEqual(state);
    expect(withFileModalState('', state)).toBe('#m=comments-42-108');
    expect(parseFileModalHash(withFileModalState('', state))).toEqual(state);
  });

  test('parses file info state without a highlight', () => {
    expect(parseFileModalState('info-42')).toEqual({
      mode: 'info',
      fileId: '42',
      highlight: undefined,
    });
  });

  test('keeps separator characters in the highlight', () => {
    expect(parseFileModalState('comments-42-part-one')).toEqual({
      mode: 'comments',
      fileId: '42',
      highlight: 'part-one',
    });
  });

  test('preserves unrelated hash state when opening and closing', () => {
    const opened = withFileModalState('#s=date-desc&v=l', {
      mode: 'comments',
      fileId: '42',
    });

    expect(opened).toBe('#s=date-desc&v=l&m=comments-42');
    expect(withFileModalState(opened)).toBe('#s=date-desc&v=l');
  });

  test('pushes an initial modal and replaces a subsequent modal', () => {
    const opened = buildFileModalNavigation(
      { hash: '#s=date-desc', state: { existing: 'value' } },
      { mode: 'info', fileId: '42' },
    );

    expect(opened).toMatchObject({
      hash: '#s=date-desc&m=info-42',
      replace: false,
      state: {
        existing: 'value',
        fileModalOpened: true,
      },
    });

    const switched = buildFileModalNavigation(
      { hash: opened.hash, state: opened.state },
      { mode: 'comments', fileId: '42' },
    );
    expect(switched).toEqual({
      hash: '#s=date-desc&m=comments-42',
      replace: true,
      state: opened.state,
    });
  });

  test('recognizes only modal entries opened in the current document', () => {
    const state = fileModalHistoryState({ existing: 'value' });

    expect(state).toMatchObject({
      existing: 'value',
      fileModalOpened: true,
    });
    expect(wasFileModalOpenedInCurrentDocument(state)).toBe(true);
    expect(
      wasFileModalOpenedInCurrentDocument({
        fileModalOpened: true,
        fileModalOpenedAt: performance.timeOrigin - 1,
      }),
    ).toBe(false);
  });

  test.each(['', 'unknown-42', 'comments-', 'info'])(
    'rejects invalid state %j',
    (value) => {
      expect(parseFileModalState(value)).toBeUndefined();
    },
  );
});
