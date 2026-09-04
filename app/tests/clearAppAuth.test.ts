import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getDefaultStore } from 'jotai';
import * as SecureStore from 'expo-secure-store';
import { clearAppAuth } from '@/src/helpers/clearAppAuth';
import { loginDetailsAtom } from '@/src/hooks/useLoginDetails';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
}));

describe('clearAppAuth', () => {
  beforeEach(() => {
    jest.mocked(SecureStore.deleteItemAsync).mockReset();
    jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
    getDefaultStore().set(loginDetailsAtom, {
      server: 'https://picr.example.com/',
      username: 'admin',
      password: 'picr1234',
      token: 'expired-token',
    });
  });

  it('clears in-memory and persisted authentication after token expiry', () => {
    clearAppAuth();

    expect(getDefaultStore().get(loginDetailsAtom)).toBeUndefined();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('login');
  });
});
