import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import * as Application from 'expo-application';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { appLogin } from '@/src/helpers/appLogin';
import { saveLoginDetails } from '@/src/hooks/useLoginDetails';

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(async () => new Uint8Array(32).fill(7)),
  digestStringAsync: jest.fn(async (_algorithm: string, value: string) => {
    const { createHash } = require('node:crypto');
    return createHash('sha256').update(value).digest('base64');
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
}));
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  WebBrowserResultType: { CANCEL: 'cancel' },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { scheme: 'picr' } },
}));
jest.mock('expo-application', () => ({
  __esModule: true,
  applicationId: 'com.isaacinsoll.picr.dev',
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('@/src/hooks/useLoginDetails', () => ({
  saveLoginDetails: jest.fn(),
}));
const fetchMock = jest.fn<typeof fetch>();
const response = (body: object) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;
const session = {
  accessToken: 'access',
  refreshToken: 'refresh',
  username: 'admin',
};
const code = 'a'.repeat(43);

describe('browser app sign-in', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
    fetchMock
      .mockReset()
      .mockResolvedValueOnce(response({ version: 1 }))
      .mockResolvedValueOnce(response(session));
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
    jest
      .mocked(WebBrowser.openAuthSessionAsync)
      .mockImplementation(async (url, redirect) => ({
        type: 'success',
        url: `${redirect}?code=${code}&state=${new URL(url).searchParams.get('state')}`,
      }));
  });
  it('returns to the native dev app even when Metro advertises the production scheme', async () => {
    await expect(appLogin('https://photos.example/picr')).resolves.toBe(true);
    const [url, callback] = jest.mocked(WebBrowser.openAuthSessionAsync).mock
      .calls[0];
    expect(callback).toBe('picrdev://auth/callback');
    const query = new URL(url);
    expect(query.pathname).toBe('/picr/app-sign-in');
    expect(query.searchParams.get('code_challenge_method')).toBe('S256');
    expect(query.searchParams.get('code_challenge')).toMatch(
      /^[A-Za-z0-9_-]{43}$/,
    );
    expect(query.searchParams.has('code_verifier')).toBe(false);
    const [tokenUrl, options] = fetchMock.mock.calls[1];
    expect(tokenUrl).toBe('https://photos.example/picr/api/auth/native/token');
    expect(options?.headers).toMatchObject({
      'x-picr-client': 'native',
      'x-picr-auth': '1',
    });
    expect(JSON.parse(String(options?.body))).toMatchObject({
      code,
      redirectUri: callback,
      codeVerifier: '07'.repeat(32),
    });
    expect(saveLoginDetails).toHaveBeenCalledWith({
      server: 'https://photos.example/picr/',
      token: 'access',
      refreshToken: 'refresh',
      username: 'admin',
    });
  });
  it('returns to the native production app with the same callback throughout the exchange', async () => {
    jest.replaceProperty(Application, 'applicationId', 'com.isaacinsoll.picr');
    await expect(appLogin('https://photos.example')).resolves.toBe(true);
    const [url, callback] = jest.mocked(WebBrowser.openAuthSessionAsync).mock
      .calls[0];
    expect(callback).toBe('picr://auth/callback');
    expect(new URL(url).searchParams.get('redirect_uri')).toBe(callback);
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      redirectUri: callback,
    });
  });
  it.each([
    'picrdev://auth/callback?code=CODE&state=wrong',
    'picrdev://wrong/callback?code=CODE&state=STATE',
    'picrdev://attacker@auth/callback?code=CODE&state=STATE',
    'picrdev://auth/callback?code=CODE&state=STATE&state=STATE',
  ])(
    'rejects untrusted callback %s before exchanging credentials',
    async (url) => {
      jest
        .mocked(WebBrowser.openAuthSessionAsync)
        .mockImplementation(async (start) => ({
          type: 'success',
          url: url
            .replaceAll('STATE', new URL(start).searchParams.get('state') ?? '')
            .replace('CODE', code),
        }));
      await expect(appLogin('https://photos.example')).rejects.toMatchObject({
        code: 'invalid_callback',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(saveLoginDetails).not.toHaveBeenCalled();
    },
  );
  it('treats browser dismissal as cancellation', async () => {
    jest
      .mocked(WebBrowser.openAuthSessionAsync)
      .mockResolvedValue({ type: WebBrowser.WebBrowserResultType.CANCEL });
    await expect(appLogin('https://photos.example')).resolves.toBe(false);
    expect(saveLoginDetails).not.toHaveBeenCalled();
  });
  it('does not open a browser on an incompatible server', async () => {
    fetchMock.mockReset().mockResolvedValue(response({}));
    await expect(appLogin('https://photos.example')).rejects.toMatchObject({
      code: 'server_upgrade_required',
    });
    expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled();
  });
});
