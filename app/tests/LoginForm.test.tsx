import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { getDefaultStore } from 'jotai';
import { sessionExpiredAtom } from '@/src/hooks/useLoginDetails';
import { LoginForm } from '@/src/components/LoginForm';
import { appLogin } from '@/src/helpers/appLogin';
import { NativeAuthError } from '@/src/helpers/nativeAuthRequest';
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock('@/src/helpers/appLogin', () => ({ appLogin: jest.fn() }));
jest.mock('@/src/helpers/appSession', () => ({
  restoreAppSession: jest.fn(async () => {}),
}));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn() }));
describe('server sign-in form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDefaultStore().set(sessionExpiredAtom, false);
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  });
  const submit = async () => {
    await render(<LoginForm />);
    await waitFor(() =>
      expect(screen.getByTestId('login-server-input').props['editable']).toBe(
        true,
      ),
    );
    await fireEvent.changeText(
      screen.getByTestId('login-server-input'),
      'photos.example/picr',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));
  };
  it('normalizes the address and navigates only after sign-in completes', async () => {
    jest.mocked(appLogin).mockResolvedValue(true);
    await submit();
    await waitFor(() =>
      expect(appLogin).toHaveBeenCalledWith('https://photos.example/picr/'),
    );
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(screen.queryByTestId('login-password-input')).toBeNull();
  });
  it('keeps cancellation calm and allows another attempt', async () => {
    jest.mocked(appLogin).mockResolvedValue(false);
    await submit();
    await waitFor(() =>
      expect(screen.getByText(/Sign-in cancelled/)).toBeTruthy(),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
  it('shows a connection error inline and preserves the server', async () => {
    jest
      .mocked(appLogin)
      .mockRejectedValue(new NativeAuthError('network_error'));
    await submit();
    await waitFor(() =>
      expect(screen.getByText(/Unable to reach your server/)).toBeTruthy(),
    );
    expect(screen.getByTestId('login-server-input').props['value']).toBe(
      'photos.example/picr',
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
  it('explains why an expired session needs another sign-in', async () => {
    getDefaultStore().set(sessionExpiredAtom, true);
    await render(<LoginForm />);
    expect(screen.getByText(/Your session has expired/)).toBeTruthy();
  });
  it('prefills the retained address without extra sign-in explanations', async () => {
    jest
      .mocked(SecureStore.getItemAsync)
      .mockImplementation(async (key) =>
        key === 'login-server' ? 'https://saved.example/' : '1',
      );
    await render(<LoginForm />);
    await waitFor(() =>
      expect(screen.getByTestId('login-server-input').props['value']).toBe(
        'https://saved.example/',
      ),
    );
    expect(screen.queryByText(/Sign in once to connect securely/)).toBeNull();
    expect(screen.queryByText(/Sign in securely on your server/)).toBeNull();
    expect(screen.queryByText(/Use the same address/)).toBeNull();
  });
});
