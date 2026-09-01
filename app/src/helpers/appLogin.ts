import type { LoginDetails } from '@/src/hooks/useLoginDetails';
import { loginMutation } from '@shared/urql/mutations/loginMutation';
import { picrUrqlClient } from '@shared/urql/urqlClient';
import { createServerOrigin } from '@/src/helpers/authenticatedServerOrigin';

export type AppLoginErrorType =
  | 'authentication_rejected'
  | 'network_unavailable'
  | 'server_error';

export type AppLoginResult =
  | { token: string; error?: never }
  | {
      token?: never;
      error: {
        type: AppLoginErrorType;
        message: string;
      };
    };

export const appLogin = async (data: LoginDetails): Promise<AppLoginResult> => {
  const { server, username, password } = data;
  // console.log(data);

  const origin = createServerOrigin(server);
  if (!origin) {
    return {
      error: {
        type: 'network_unavailable',
        message:
          'Unable to connect to server. Check the server URL and network connection.',
      },
    };
  }

  const newClient = picrUrqlClient(origin.baseUrl, {});
  // TODO: Fix this await mutation crashing on iOS 16.4
  // No errors in console, so I just set minimum target to 17 for now :(
  const result = await newClient
    .mutation(loginMutation, { username, password })
    .toPromise();
  const token = result.data?.auth;
  if (token) {
    return { token };
  }

  if (!result.error && token === '') {
    return {
      error: {
        type: 'authentication_rejected',
        message: 'Incorrect username or password',
      },
    };
  }
  if (result.error?.networkError) {
    return {
      error: {
        type: 'network_unavailable',
        message:
          'Unable to connect to server. Check the server URL and network connection.',
      },
    };
  }
  return {
    error: {
      type: 'server_error',
      message: 'The server could not complete the login. Please try again.',
    },
  };
};
