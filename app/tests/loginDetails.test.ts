import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { getDefaultStore } from 'jotai';
import {
  clearLoginDetails,
  getLoginDetailsFromLocalDevice,
  loginDetailsAtom,
  saveLoginDetails,
} from '@/src/hooks/useLoginDetails';
jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));
const login = {
  server: 'https://photos.example/',
  username: 'admin',
  token: 'token',
  refreshToken: 'refresh',
};
describe('secure session storage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getDefaultStore().set(loginDetailsAtom, undefined);
  });
  it('loads version 2 without rewriting it', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValue(JSON.stringify({ version: 2, login }));
    await expect(getLoginDetailsFromLocalDevice()).resolves.toEqual(login);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    'removes old passwords, retaining only server and username (wrapped=%s)',
    async (wrapped) => {
      const old = {
        server: login.server,
        username: login.username,
        password: 'old-password',
        token: 'legacy',
      };
      jest
        .mocked(SecureStore.getItemAsync)
        .mockResolvedValue(
          JSON.stringify(wrapped ? { version: 1, login: old } : old),
        );
      await expect(getLoginDetailsFromLocalDevice()).resolves.toBeUndefined();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('login');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'login-server',
        login.server,
      );
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        'login-username',
        login.username,
      );
      expect(
        JSON.stringify(jest.mocked(SecureStore.setItemAsync).mock.calls),
      ).not.toContain(old.password);
    },
  );
  it('removes corrupt data without crashing startup', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('{broken');
    await expect(getLoginDetailsFromLocalDevice()).resolves.toBeUndefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('login');
  });
  it('does not restore a session when logout occurs during a secure write', async () => {
    getDefaultStore().set(loginDetailsAtom, login);
    let finish: () => void = () => {};
    let started: () => void = () => {};
    const writing = new Promise<void>((resolve) => {
      started = resolve;
    });
    jest.mocked(SecureStore.setItemAsync).mockImplementation(async (key) => {
      if (key === 'login') {
        started();
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      }
    });
    const saving = saveLoginDetails({ ...login, token: 'new' }, login);
    await writing;
    const clearing = clearLoginDetails();
    finish();
    await Promise.all([saving, clearing]);
    expect(getDefaultStore().get(loginDetailsAtom)).toBeUndefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenLastCalledWith('login');
  });
});
