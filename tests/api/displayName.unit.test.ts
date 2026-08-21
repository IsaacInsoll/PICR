import { describe, expect, it } from 'vitest';
import { displayFolderName } from '../../shared/displayName';

describe('displayFolderName', () => {
  it('uses the localized label only for the structural root', () => {
    expect(displayFolderName({ name: 'Home', parentId: null }, 'Accueil')).toBe(
      'Accueil',
    );
    expect(displayFolderName({ name: 'Home', parentId: '1' }, 'Accueil')).toBe(
      'Home',
    );
  });

  it('does not mistake an incomplete folder identity for the root', () => {
    expect(displayFolderName({ name: 'Home' }, 'Accueil')).toBe('Home');
  });

  it('retains display-name normalization for ordinary folders', () => {
    expect(
      displayFolderName({ name: 'Parent\uF022Child', parentId: '1' }, 'Home'),
    ).toBe('Parent/Child');
  });
});
