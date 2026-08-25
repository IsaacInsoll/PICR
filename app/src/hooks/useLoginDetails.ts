import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

const loginDetailsSchema = z.object({
  server: z.string().url(),
  username: z.string().min(1),
  password: z.string().min(1),
  hostname: z.string().optional(),
  token: z.string().optional(),
});

const storedLoginDetailsSchema = z.object({
  version: z.literal(1),
  login: loginDetailsSchema,
});

export type LoginDetails = z.infer<typeof loginDetailsSchema>;

export const loginDetailsAtom = atom<LoginDetails | undefined>(undefined);

export const useLoginDetails = () => {
  const details = useAtomValue(loginDetailsAtom);
  if (!details) return undefined;
  return {
    ...details,
    hostname: details.server.replace(/(^\w+:|^)\/\//, ''),
  };
};

export const useSetLoginDetails = () => {
  const setter = useSetAtom(loginDetailsAtom);
  return async (details: LoginDetails) => {
    const payload: LoginDetails = {
      ...details,
      hostname: getHostname(details.server),
    };
    setter(payload);
    await saveLoginDetailsToLocalDevice(payload);
  };
};

export const useSetLoggedOut = () => {
  const router = useRouter();
  const setter = useSetAtom(loginDetailsAtom);
  return async () => {
    setter(undefined);
    await SecureStore.deleteItemAsync('login');
    router.replace('/login');
  };
};

const getHostname = (str: string): string => {
  return str.replace(/(^\w+:|^)\/\//, '');
};

const saveLoginDetailsToLocalDevice = async (details: LoginDetails) => {
  await SecureStore.setItemAsync(
    'login',
    JSON.stringify({ version: 1, login: details }),
  );
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

  const storedLogin = storedLoginDetailsSchema.safeParse(parsed);
  if (storedLogin.success) return storedLogin.data.login;

  // SDK 55 and earlier stored LoginDetails directly. Accept it once and rewrite
  // it immediately so all subsequent reads use the versioned contract.
  const legacyLogin = loginDetailsSchema.safeParse(parsed);
  if (legacyLogin.success) {
    await saveLoginDetailsToLocalDevice(legacyLogin.data);
    return legacyLogin.data;
  }

  await SecureStore.deleteItemAsync('login');
  return undefined;
};
