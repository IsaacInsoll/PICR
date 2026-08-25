import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { getLoginDetailsFromLocalDevice } from '@/src/hooks/useLoginDetails';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe('getLoginDetailsFromLocalDevice', () => {
  beforeEach(() => {
    jest.mocked(SecureStore.getItemAsync).mockReset();
    jest.mocked(SecureStore.setItemAsync).mockReset();
    jest.mocked(SecureStore.deleteItemAsync).mockReset();
  });

  it('returns undefined when the device has no saved login', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

    await expect(getLoginDetailsFromLocalDevice()).resolves.toBeUndefined();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('login');
  });

  it('loads and migrates the existing unversioned login payload', async () => {
    const login = {
      server: 'https://picr.example.com/',
      username: 'admin',
      password: 'picr1234',
      token: 'token',
    };
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValue(JSON.stringify(login));

    await expect(getLoginDetailsFromLocalDevice()).resolves.toEqual(login);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'login',
      JSON.stringify({ version: 1, login }),
    );
  });

  it('loads the versioned login payload without rewriting it', async () => {
    const login = {
      server: 'https://picr.example.com/',
      username: 'admin',
      password: 'picr1234',
      token: 'token',
    };
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValue(JSON.stringify({ version: 1, login }));

    await expect(getLoginDetailsFromLocalDevice()).resolves.toEqual(login);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('removes malformed persisted JSON instead of crashing app startup', async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue('{broken');

    await expect(getLoginDetailsFromLocalDevice()).resolves.toBeUndefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('login');
  });

  it('removes a payload that does not match the login contract', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockResolvedValue(
        JSON.stringify({ version: 1, login: { username: 'admin' } }),
      );

    await expect(getLoginDetailsFromLocalDevice()).resolves.toBeUndefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('login');
  });
});
