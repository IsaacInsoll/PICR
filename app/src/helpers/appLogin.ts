import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { createServerOrigin } from './authenticatedServerOrigin';
import { NativeAuthError, nativeAuthRequest } from './nativeAuthRequest';
import { saveLoginDetails } from '../hooks/useLoginDetails';

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  username: z.string().optional(),
});
const randomValue = async () =>
  Array.from(await Crypto.getRandomBytesAsync(32), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
let signIn: Promise<boolean> | undefined;
export const appLogin = (server: string): Promise<boolean> => {
  if (signIn) return signIn;
  signIn = browserLogin(server).finally(() => {
    signIn = undefined;
  });
  return signIn;
};
async function browserLogin(server: string): Promise<boolean> {
  const origin = createServerOrigin(server);
  if (!origin) throw new NativeAuthError('invalid_server');
  const config = await nativeAuthRequest(origin.baseUrl, 'native/config');
  if (!z.object({ version: z.literal(1) }).safeParse(config).success)
    throw new NativeAuthError('server_upgrade_required');
  await SecureStore.setItemAsync('login-server', origin.baseUrl);
  const verifier = await randomValue();
  const state = await randomValue();
  const challenge = (
    await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      verifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const redirectUri =
    Application.applicationId === 'com.isaacinsoll.picr.dev'
      ? 'picrdev://auth/callback'
      : 'picr://auth/callback';
  const loginUrl = new URL(origin.urlForPath('app-sign-in'));
  loginUrl.searchParams.set('redirect_uri', redirectUri);
  loginUrl.searchParams.set('code_challenge', challenge);
  loginUrl.searchParams.set('code_challenge_method', 'S256');
  loginUrl.searchParams.set('state', state);
  const username = await SecureStore.getItemAsync('login-username');
  if (username) loginUrl.searchParams.set('login_hint', username);
  const result = await WebBrowser.openAuthSessionAsync(
    loginUrl.toString(),
    redirectUri,
  );
  if (result.type !== 'success') return false;
  const callback = new URL(result.url);
  if (
    callback.username ||
    callback.password ||
    callback.hash ||
    `${callback.protocol}//${callback.host}${callback.pathname}` !==
      redirectUri ||
    callback.searchParams.get('state') !== state ||
    [...callback.searchParams.keys()].some(
      (key) => callback.searchParams.getAll(key).length !== 1,
    )
  )
    throw new NativeAuthError('invalid_callback');
  if (callback.searchParams.get('error') === 'access_denied') return false;
  const code = callback.searchParams.get('code');
  if (
    !code ||
    !/^[A-Za-z0-9_-]{43}$/.test(code) ||
    callback.searchParams.has('error')
  )
    throw new NativeAuthError('invalid_callback');
  const session = sessionSchema.parse(
    await nativeAuthRequest(origin.baseUrl, 'native/token', {
      code,
      codeVerifier: verifier,
      redirectUri,
    }),
  );
  await saveLoginDetails({
    server: origin.baseUrl,
    token: session.accessToken,
    refreshToken: session.refreshToken,
    username: session.username,
  });
  await SecureStore.deleteItemAsync('login-username');
  return true;
}
