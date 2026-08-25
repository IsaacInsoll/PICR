import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  NotificationSettings,
  NotificationToggle,
} from '@/src/components/NotificationSettings';
import { registerForPushNotificationsAsync } from '@/src/helpers/pushNotifications';

const mockMutate =
  jest.fn<(variables: Record<string, unknown>) => Promise<{ error?: Error }>>();
const mockRequery = jest.fn();
const mockUseQuery = jest.fn();

jest.mock('urql', () => ({
  useMutation: () => [{}, mockMutate],
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock('@/src/helpers/pushNotifications', () => ({
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock('@/src/hooks/useMe', () => ({
  useMe: () => ({ id: 'user-1' }),
}));

jest.mock('@/src/helpers/useIsDev', () => ({
  useIsDev: () => true,
}));

jest.mock('@/src/hooks/useAppTheme', () => ({
  useAppTheme: () => ({ textColor: '#111111' }),
}));

jest.mock('expo-device', () => ({
  modelName: 'Test Device',
}));

describe('NotificationSettings', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockRequery.mockReset();
    mockUseQuery.mockReset();
    jest.mocked(registerForPushNotificationsAsync).mockReset();
  });

  it('settles into an explicit unavailable state without a device push token', async () => {
    jest.mocked(registerForPushNotificationsAsync).mockResolvedValue(undefined);

    await render(<NotificationSettings />);

    await waitFor(() => {
      expect(
        screen.getByTestId('notification-toggle-settled'),
      ).toBeOnTheScreen();
      expect(
        screen.getByTestId('notification-toggle-unavailable'),
      ).toBeOnTheScreen();
    });
  });

  it('exposes mutation completion for a notification preference change', async () => {
    mockUseQuery.mockReturnValue([
      { data: { userDevices: [{ enabled: false }] } },
      mockRequery,
    ]);
    mockMutate.mockResolvedValue({});

    await render(<NotificationToggle token="token DEV" userId="user-1" />);
    await fireEvent(screen.getByTestId('notification-toggle'), 'change', {
      nativeEvent: { value: true },
    });

    await waitFor(() => {
      expect(screen.getByTestId('notification-toggle-saved')).toBeOnTheScreen();
    });
    expect(mockMutate).toHaveBeenCalledWith({
      enabled: true,
      name: 'Test Device',
      token: 'token DEV',
      userId: 'user-1',
    });
    expect(mockRequery).toHaveBeenCalledWith({
      requestPolicy: 'cache-and-network',
    });
  });
});
