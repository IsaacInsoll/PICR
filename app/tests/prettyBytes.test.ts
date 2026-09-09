import { formatBytes, prettyBytes } from '@shared/prettyBytes';

describe('prettyBytes', () => {
  it('formats bytes when Intl.NumberFormat.formatToParts is unavailable', () => {
    const originalFormatToParts = Intl.NumberFormat.prototype.formatToParts;

    Object.defineProperty(Intl.NumberFormat.prototype, 'formatToParts', {
      configurable: true,
      value: undefined,
    });

    try {
      expect(prettyBytes(1536, { locale: 'en' })).toBe('1.54 kB');
      expect(formatBytes(1536, 'en').fractionDigits).toBe(2);
    } finally {
      Object.defineProperty(Intl.NumberFormat.prototype, 'formatToParts', {
        configurable: true,
        value: originalFormatToParts,
        writable: true,
      });
    }
  });
});
