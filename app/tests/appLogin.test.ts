import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { picrUrqlClient } from '@shared/urql/urqlClient';
import { appLogin } from '@/src/helpers/appLogin';

type LoginResult = {
  data?: { auth?: string };
  error?: {
    message: string;
    networkError?: Error;
    graphQLErrors: Array<{
      message: string;
      extensions: Record<string, unknown>;
    }>;
  };
};

const mockToPromise = jest.fn<() => Promise<LoginResult>>();
const mockMutation = jest.fn(() => ({ toPromise: mockToPromise }));

jest.mock('@shared/urql/urqlClient', () => ({
  picrUrqlClient: jest.fn(() => ({ mutation: mockMutation })),
}));

const loginDetails = {
  server: 'https://picr.example.com/',
  username: 'admin',
  password: 'picr1234',
};

describe('appLogin', () => {
  beforeEach(() => {
    mockMutation.mockReset();
    mockMutation.mockImplementation(() => ({ toPromise: mockToPromise }));
    mockToPromise.mockReset();
    jest.mocked(picrUrqlClient).mockClear();
  });

  it('returns the authentication token', async () => {
    mockToPromise.mockResolvedValue({ data: { auth: 'token' } });

    await expect(appLogin(loginDetails)).resolves.toEqual({ token: 'token' });
    expect(picrUrqlClient).toHaveBeenCalledWith(loginDetails.server, {});
    expect(mockMutation).toHaveBeenCalledWith(expect.anything(), {
      username: 'admin',
      password: 'picr1234',
    });
  });

  it('classifies the server empty-token response as rejected authentication', async () => {
    mockToPromise.mockResolvedValue({ data: { auth: '' } });

    await expect(appLogin(loginDetails)).resolves.toEqual({
      error: {
        type: 'authentication_rejected',
        message: 'Incorrect username or password',
      },
    });
  });

  it('classifies transport failures from network metadata', async () => {
    mockToPromise.mockResolvedValue({
      error: {
        message: 'Network request failed',
        networkError: new Error('Network request failed'),
        graphQLErrors: [],
      },
    });

    await expect(appLogin(loginDetails)).resolves.toEqual({
      error: {
        type: 'network_unavailable',
        message:
          'Unable to connect to server. Check the server URL and network connection.',
      },
    });
  });

  it('does not mistake unstructured GraphQL message text for invalid credentials', async () => {
    mockToPromise.mockResolvedValue({
      error: {
        message: 'Incorrect username or password',
        graphQLErrors: [
          {
            message: 'Incorrect username or password',
            extensions: {},
          },
        ],
      },
    });

    await expect(appLogin(loginDetails)).resolves.toEqual({
      error: {
        type: 'server_error',
        message: 'The server could not complete the login. Please try again.',
      },
    });
  });
});
