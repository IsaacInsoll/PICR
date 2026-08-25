import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { picrUrqlClient } from '@shared/urql/urqlClient';
import { appLogin } from '@/src/helpers/appLogin';

type LoginResult = {
  data?: { auth?: string };
  error?: { message: string };
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

  it('classifies an empty auth response as invalid credentials', async () => {
    mockToPromise.mockResolvedValue({ data: { auth: '' } });

    await expect(appLogin(loginDetails)).resolves.toEqual({
      error: 'Incorrect username or password',
    });
  });

  it('includes the GraphQL error when the server request fails', async () => {
    mockToPromise.mockResolvedValue({
      error: { message: 'Network request failed' },
    });

    await expect(appLogin(loginDetails)).resolves.toEqual({
      error: 'Unable to connect to server: Network request failed',
    });
  });
});
