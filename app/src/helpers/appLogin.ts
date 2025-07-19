import { LoginDetails } from '@/src/hooks/useLoginDetails';
import { loginMutation } from '@shared/urql/mutations/loginMutation';
import { picrUrqlClient } from '@shared/urql/urqlClient';

export const appLogin = async (data: LoginDetails) => {
  const { server, username, password } = data;
  console.log(data);

  const newClient = picrUrqlClient(server, {});
  // TODO: Fix this await mutation crashing on iOS 16.4
  // No errors in console, so I just set minimum target to 17 for now :(
  const result = await newClient
    .mutation(loginMutation, { username, password })
    .toPromise();
  const token = result?.data?.auth;
  if (token) {
    return { token };
  } else {
    const message = result.error
      ? 'Unable to connect to server: ' + result.error.message
      : 'Incorrect username or password';
    return { error: message };
  }
};
