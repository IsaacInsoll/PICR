import { describe, expect, test } from 'vitest';
import { searchForFolderNavigation } from './useSetFolder';

describe('folder gallery criteria navigation', () => {
  test('preserves the full query string when opening a file', () => {
    const search = '?link=4&find=1&q=social&rating=gte%3A5&folder=8';
    expect(searchForFolderNavigation(search, 'preserve')).toBe(search);
  });

  test('carries structured gallery filters but leaves Results mode behind', () => {
    expect(
      searchForFolderNavigation(
        '?link=4&find=1&q=social&rating=gte%3A5&folder=8&camera=Canon',
        'carry-gallery',
      ),
    ).toBe('?link=4&rating=gte%3A5&camera=Canon');
  });

  test('clears the query string for unrelated folder navigation', () => {
    expect(searchForFolderNavigation('?link=4&rating=gte%3A5', 'clear')).toBe(
      '',
    );
  });
});
