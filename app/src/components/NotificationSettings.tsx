import { useEffect, useState } from 'react';
import { useMe } from '@/src/hooks/useMe';
import { useMutation, useQuery } from 'urql';
import { userDeviceQuery } from '@shared/urql/queries/userDeviceQuery';
import { editUserDeviceMutation } from '@shared/urql/mutations/editUserDeviceMutation';
import {
  checkPushNotificationRegistrationAsync,
  registerForPushNotificationsAsync,
  type PushNotificationRegistration,
} from '@/src/helpers/pushNotifications';
import * as Device from 'expo-device';
import { Alert, Switch, View } from 'react-native';
import { PText } from '@/src/components/PText';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { useIsDev } from '@/src/helpers/useIsDev';

export const NotificationSettings = () => {
  const [registration, setRegistration] =
    useState<PushNotificationRegistration>();
  const [requestingPermission, setRequestingPermission] = useState(false);
  const me = useMe();
  const isDev = useIsDev();
  const [, enableDevice] = useMutation(editUserDeviceMutation);

  useEffect(() => {
    void checkPushNotificationRegistrationAsync().then((result) => {
      setRegistration(withEnvironmentToken(result, isDev));
    });
  }, [isDev]);

  const userId = me?.id;
  const token = registration?.status === 'registered' && registration.token;
  const canEditNotifications = typeof token === 'string' && !!userId;
  const canRequestRegistration =
    registration?.status === 'permission-required' ||
    registration?.status === 'permission-denied' ||
    registration?.status === 'error';

  const requestPermission = async (enabled: boolean) => {
    if (!enabled || requestingPermission) return;

    setRequestingPermission(true);
    const result = await registerForPushNotificationsAsync();
    const nextRegistration = withEnvironmentToken(result, isDev);

    if (nextRegistration.status === 'registered' && userId) {
      const mutationResult = await enableDevice({
        enabled: true,
        token: nextRegistration.token,
        userId,
        name: Device.modelName ?? 'Mobile Device',
      });
      if (mutationResult.error) {
        Alert.alert(
          'Notifications unavailable',
          'PICR could not save notification settings for this device. Please try again.',
        );
      }
    }

    setRegistration(nextRegistration);
    setRequestingPermission(false);

    if (nextRegistration.status === 'permission-denied') {
      Alert.alert(
        'Notifications are disabled',
        'Allow notifications for PICR in your device settings to enable them.',
      );
    } else if (nextRegistration.status === 'error') {
      Alert.alert(
        'Notifications unavailable',
        'PICR could not register this device for notifications. Please try again.',
      );
    }
  };

  return (
    <View
      testID="notification-settings"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
      }}
    >
      <PText>Allow Notifications</PText>
      {registration === undefined ? (
        <View testID="notification-toggle-loading">
          <AppLoadingIndicator size="small" />
        </View>
      ) : (
        <View testID="notification-toggle-settled">
          {canEditNotifications ? (
            <NotificationToggle token={token} userId={userId} />
          ) : canRequestRegistration ? (
            <Switch
              accessibilityLabel="Allow notifications"
              testID="notification-toggle-permission-required"
              disabled={requestingPermission}
              value={false}
              onValueChange={(enabled) => void requestPermission(enabled)}
            />
          ) : (
            <Switch
              accessibilityLabel="Allow notifications"
              testID="notification-toggle-unavailable"
              disabled={true}
            />
          )}
        </View>
      )}
    </View>
  );
};

const withEnvironmentToken = (
  registration: PushNotificationRegistration,
  isDev: boolean,
): PushNotificationRegistration =>
  registration.status === 'registered' && isDev
    ? { ...registration, token: `${registration.token} DEV` }
    : registration;

export const NotificationToggle = ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) => {
  const [result, requery] = useQuery({
    query: userDeviceQuery,
    variables: { userId, token },
  });
  const [, mutate] = useMutation(editUserDeviceMutation);
  const allow = result.data?.userDevices[0]?.enabled ?? false;
  const [saveState, setSaveState] = useState<'ready' | 'saving' | 'saved'>(
    'ready',
  );

  const onChange = async (enabled: boolean) => {
    setSaveState('saving');
    const mutationResult = await mutate({
      enabled,
      token,
      userId,
      name: Device.modelName ?? 'Mobile Device',
    });
    setSaveState(mutationResult.error ? 'ready' : 'saved');
    void requery({ requestPolicy: 'cache-and-network' });
  };
  const handleChange = (enabled: boolean) => {
    void onChange(enabled);
  };

  if (result.fetching && !result.data) {
    return <AppLoadingIndicator size="small" />;
  }

  return (
    <Switch
      accessibilityLabel="Allow notifications"
      testID={`notification-toggle${
        saveState === 'ready' ? '' : `-${saveState}`
      }`}
      disabled={saveState === 'saving'}
      value={allow}
      onChange={(event) => handleChange(event.nativeEvent.value)}
    />
  );
};
