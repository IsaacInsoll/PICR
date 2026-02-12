import { getDefaultStore } from 'jotai';
import * as SecureStore from 'expo-secure-store';
import { loginDetailsAtom } from '../hooks/useLoginDetails';

export const clearAppAuth = () => {
  getDefaultStore().set(loginDetailsAtom, undefined);
  SecureStore.deleteItemAsync('login');
};
