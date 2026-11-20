import { atom, getDefaultStore, useAtomValue } from 'jotai';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { nativeAuthRequest } from '@/src/helpers/nativeAuthRequest';
import { normalizeServerBaseUrl } from '@/src/helpers/authenticatedServerOrigin';

const loginDetailsSchema = z.object({
  server: z
    .string()
    .url()
    .refine((value) => normalizeServerBaseUrl(value) !== null),
  username: z.string().optional(),
  token: z.string().min(1),
  refreshToken: z.string().min(1),
});
const storedLoginDetailsSchema = z.object({
  version: z.literal(2),
  login: loginDetailsSchema,
});
export type LoginDetails = z.infer<typeof loginDetailsSchema>;
export const loginDetailsAtom = atom<LoginDetails | undefined>(undefined);
export const sessionExpiredAtom = atom(false);
export const useLoginDetails = () => useAtomValue(loginDetailsAtom);
const store = getDefaultStore();
// Serialize mutations so an old refresh cannot overwrite logout/new login.
let storageWork = Promise.resolve();
function writeStorage(work: () => Promise<void>) {
  const result = storageWork.then(work);
  storageWork = result.catch(() => {});
  return result;
}
export const saveLoginDetails = async (
  details: LoginDetails,
  expected?: LoginDetails,
) => {
  await writeStorage(async () => {
    if (expected && store.get(loginDetailsAtom) !== expected) return;
    await SecureStore.setItemAsync('login-server', details.server);
    await SecureStore.deleteItemAsync('login-migrated');
    await SecureStore.setItemAsync(
      'login',
      JSON.stringify({ version: 2, login: details }),
    );
    if (expected && store.get(loginDetailsAtom) !== expected) return;
    store.set(loginDetailsAtom, details);
    store.set(sessionExpiredAtom, false);
  });
};
export const clearLoginDetails = () => {
  store.set(loginDetailsAtom, undefined);
  return writeStorage(() => SecureStore.deleteItemAsync('login'));
};
export const useSetLoggedOut = () => {
  const router = useRouter();
  return async () => {
    const login = store.get(loginDetailsAtom);
    await clearLoginDetails();
    router.replace('/login');
    if (login) {
      try {
        await nativeAuthRequest(login.server, 'logout', {
          refreshToken: login.refreshToken,
        });
      } catch {
        /* Local sign-out works offline; remote inactivity expiry still applies. */
      }
    }
  };
};
export const getLoginDetailsFromLocalDevice = async (): Promise<
  LoginDetails | undefined
> => {
  const json = await SecureStore.getItemAsync('login');
  if (!json) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    await SecureStore.deleteItemAsync('login');
    return undefined;
  }
  const current = storedLoginDetailsSchema.safeParse(parsed);
  if (current.success) return current.data.login;
  const legacy = z.object({
    server: z.string().url(),
    username: z.string().optional(),
  });
  const wrapped = z
    .object({ version: z.literal(1), login: legacy })
    .safeParse(parsed);
  const old = wrapped.success
    ? wrapped.data.login
    : legacy.safeParse(parsed).data;
  if (old && normalizeServerBaseUrl(old.server)) {
    await SecureStore.setItemAsync('login-server', old.server);
    if (old.username)
      await SecureStore.setItemAsync('login-username', old.username);
    await SecureStore.setItemAsync('login-migrated', '1');
  }
  await SecureStore.deleteItemAsync('login');
  return undefined;
};
