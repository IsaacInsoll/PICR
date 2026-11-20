import { describe, expect, it } from '@jest/globals';
import { loginFormSchema, normalizeServerUrl } from '@/src/helpers/loginForm';
describe('server form', () => {
  it.each([
    ['photos.example', 'https://photos.example/'],
    [' https://photos.example ', 'https://photos.example/'],
    ['http://192.168.1.2:6900', 'http://192.168.1.2:6900/'],
    ['https://photos.example/base', 'https://photos.example/base/'],
  ])('accepts and normalizes %s', (input, expected) => {
    expect(loginFormSchema.safeParse({ server: input }).success).toBe(true);
    expect(normalizeServerUrl(input)).toBe(expected);
  });
  it.each([
    '',
    '   ',
    'ftp://photos.example/',
    'https://user:password@photos.example/',
  ])('rejects %s', (server) => {
    expect(loginFormSchema.safeParse({ server }).success).toBe(false);
  });
});
