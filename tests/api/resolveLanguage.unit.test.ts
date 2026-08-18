import { describe, expect, it } from 'vitest';
import { resolveLanguage } from '../../shared/i18n/resolveLanguage';

describe('resolveLanguage', () => {
  it('keeps supported base language and formatting locale separate', () => {
    expect(resolveLanguage('fr-CA')).toEqual({
      catalogLanguage: 'fr',
      formattingLocale: 'fr-CA',
    });
  });

  it('canonicalizes locale tags', () => {
    expect(resolveLanguage('EN_us')).toEqual({
      catalogLanguage: 'en',
      formattingLocale: 'en-US',
    });
  });

  it('uses English catalogs without discarding a valid unsupported locale', () => {
    expect(resolveLanguage('de-DE')).toEqual({
      catalogLanguage: 'en',
      formattingLocale: 'de-DE',
    });
  });

  it.each([undefined, null, '', 'not a locale'])(
    'falls back completely for an absent or invalid tag: %s',
    (languageTag) => {
      expect(resolveLanguage(languageTag)).toEqual({
        catalogLanguage: 'en',
        formattingLocale: 'en',
      });
    },
  );
});
