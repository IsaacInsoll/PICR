import { describe, expect, it } from 'vitest';
import {
  formattingLocaleForLanguage,
  resolveLanguage,
} from '../../shared/i18n/resolveLanguage';

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

describe('formattingLocaleForLanguage', () => {
  it('preserves a regional locale when its base language is selected', () => {
    expect(formattingLocaleForLanguage('en', ['en-AU'])).toBe('en-AU');
    expect(formattingLocaleForLanguage('fr', ['fr-CA'])).toBe('fr-CA');
  });

  it('finds a matching regional locale after switching languages', () => {
    expect(formattingLocaleForLanguage('en', ['fr-CA', 'en-AU'])).toBe('en-AU');
  });

  it('uses the selected catalog language when no regional locale matches', () => {
    expect(formattingLocaleForLanguage('fr', ['en-AU', 'de-DE'])).toBe('fr');
  });

  it('prefers a regional tag over an earlier base-language-only tag', () => {
    expect(formattingLocaleForLanguage('en', ['en', 'en-AU'])).toBe('en-AU');
  });
});
