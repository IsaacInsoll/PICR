import { describe, expect, it } from '@jest/globals';
import { loginFormSchema, normalizeServerUrl } from '@/src/helpers/loginForm';

describe('normalizeServerUrl', () => {
  it.each([
    ['picr.example.com', 'https://picr.example.com/'],
    [' https://picr.example.com ', 'https://picr.example.com/'],
    ['http://192.168.1.2:6900', 'http://192.168.1.2:6900/'],
    ['https://picr.example.com/base', 'https://picr.example.com/base/'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeServerUrl(input)).toBe(expected);
  });
});

describe('loginFormSchema', () => {
  it('accepts the default PICR admin username', () => {
    const result = loginFormSchema.safeParse({
      server: 'https://picr.example.com/',
      username: 'admin',
      password: 'picr1234',
    });

    expect(result.success).toBe(true);
  });

  it('trims a non-empty username', () => {
    const result = loginFormSchema.parse({
      server: 'https://picr.example.com/',
      username: ' photographer ',
      password: 'password',
    });

    expect(result.username).toBe('photographer');
  });

  it('rejects an empty username', () => {
    const result = loginFormSchema.safeParse({
      server: 'https://picr.example.com/',
      username: '   ',
      password: 'password',
    });

    expect(result.success).toBe(false);
  });

  it('rejects non-HTTP server origins', () => {
    const result = loginFormSchema.safeParse({
      server: 'ftp://picr.example.com/',
      username: 'admin',
      password: 'picr1234',
    });

    expect(result.success).toBe(false);
  });
});
