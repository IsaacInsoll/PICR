import { describe, expect, it } from '@jest/globals';
import { FileType } from '@shared/gql/graphql';
import {
  createAuthenticatedServerOrigin,
  createServerOrigin,
  normalizeServerBaseUrl,
} from '@/src/helpers/authenticatedServerOrigin';

const image = {
  id: '42',
  fileHash: 'hash',
  name: 'client #1.jpg',
  type: FileType.Image,
};

describe('server origin contract', () => {
  it.each([
    ['picr.example.com', 'https://picr.example.com/'],
    [' https://picr.example.com ', 'https://picr.example.com/'],
    ['http://192.168.1.2:6900', 'http://192.168.1.2:6900/'],
    ['https://picr.example.com/base', 'https://picr.example.com/base/'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeServerBaseUrl(input)).toBe(expected);
  });

  it('preserves a base path for GraphQL and media while using the host as the route key', () => {
    const origin = createServerOrigin('http://192.168.1.2:6900/picr');

    expect(origin).not.toBeNull();
    expect(origin?.baseUrl).toBe('http://192.168.1.2:6900/picr/');
    expect(origin?.basePath).toBe('/picr/');
    expect(origin?.routeKey).toBe('192.168.1.2:6900');
    expect(origin?.urlForPath('graphql')).toBe(
      'http://192.168.1.2:6900/picr/graphql',
    );
    expect(origin?.mediaUrl(image, 'v1-500j80')).toBe(
      'http://192.168.1.2:6900/picr/image/42/v1-500j80/hash/client%20%231.jpg',
    );
  });

  it('adds one authorization contract for authenticated requests', () => {
    const origin = createAuthenticatedServerOrigin({
      server: 'https://picr.example.com/base/',
      token: 'secret-token',
      userAgent: 'PICR ios 1.0',
    });

    expect(origin?.requestHeaders).toEqual({
      authorization: 'Bearer secret-token',
      'user-agent': 'PICR ios 1.0',
    });
    expect(origin?.baseUrl).toBe('https://picr.example.com/base/');
  });

  it.each([
    'not a url',
    'ftp://picr.example.com/',
    'https://user@picr.example.com/',
  ])('rejects unsupported server URL %s', (server) => {
    expect(createServerOrigin(server)).toBeNull();
  });

  it('does not create an authenticated origin without a token', () => {
    expect(
      createAuthenticatedServerOrigin({
        server: 'https://picr.example.com/',
        userAgent: 'PICR android 1.0',
      }),
    ).toBeNull();
  });
});
