for (const api of [
  'getCanonicalLocales',
  'Locale',
  'PluralRules',
  'RelativeTimeFormat',
]) {
  Object.defineProperty(Intl, api, {
    configurable: true,
    value: undefined,
    writable: true,
  });
}

await import('../src/polyfills.ts');

for (const locale of ['el', 'en', 'fr']) {
  const formatted = new Intl.RelativeTimeFormat(locale, {
    numeric: 'always',
  }).format(-2, 'hour');

  if (!formatted) {
    throw new Error(`RelativeTimeFormat returned no output for ${locale}`);
  }
}

console.log(
  'Hermes-shaped RelativeTimeFormat bootstrap passed for el, en, fr.',
);
