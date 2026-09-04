import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginForm } from '@/src/components/LoginForm';
import { appLogin } from '@/src/helpers/appLogin';

const mockReplace = jest.fn();
const mockSetLogin = jest.fn<() => Promise<void>>();

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/src/helpers/appLogin', () => ({
  appLogin: jest.fn(),
}));

jest.mock('@/src/hooks/useLoginDetails', () => ({
  useSetLoginDetails: () => mockSetLogin,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    jest.mocked(appLogin).mockReset();
    mockReplace.mockReset();
    mockSetLogin.mockReset();
  });

  it('normalizes the server and logs in with a plain admin username', async () => {
    jest.mocked(appLogin).mockResolvedValue({ token: 'token' });
    mockSetLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    await render(<LoginForm />);

    await user.type(
      screen.getByTestId('login-server-input'),
      'picr.example.com',
    );
    await fireEvent(screen.getByTestId('login-server-input'), 'blur');
    await user.type(screen.getByTestId('login-username-input'), 'admin');
    await user.type(screen.getByTestId('login-password-input'), 'picr1234');
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(appLogin).toHaveBeenCalledWith({
        server: 'https://picr.example.com/',
        username: 'admin',
        password: 'picr1234',
      });
    });
    expect(mockSetLogin).toHaveBeenCalledWith({
      server: 'https://picr.example.com/',
      username: 'admin',
      password: 'picr1234',
      token: 'token',
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('shows the message from a typed login failure', async () => {
    jest.mocked(appLogin).mockResolvedValue({
      error: {
        type: 'authentication_rejected',
        message: 'Incorrect username or password',
      },
    });
    const alert = jest.spyOn(Alert, 'alert');
    const user = userEvent.setup();
    await render(<LoginForm />);

    await user.type(
      screen.getByTestId('login-server-input'),
      'https://picr.example.com/',
    );
    await user.type(screen.getByTestId('login-username-input'), 'admin');
    await user.type(
      screen.getByTestId('login-password-input'),
      'incorrectPassword',
    );
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith(
        'Login Failed',
        'Incorrect username or password',
        expect.any(Array),
      );
    });
    expect(mockSetLogin).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
