import { useEffect, useState } from 'react';
import { useMe } from '@/src/hooks/useMe';
import { useMutation, useQuery } from 'urql';
import { userDeviceQuery } from '@shared/urql/queries/userDeviceQuery';
import { editUserDeviceMutation } from '@shared/urql/mutations/editUserDeviceMutation';
import { registerForPushNotificationsAsync } from '@/src/helpers/pushNotifications';
import * as Device from 'expo-device';
import { Switch, View } from 'react-native';
import { PText } from '@/src/components/PText';
import { AppLoadingIndicator } from '@/src/components/AppLoadingIndicator';
import { useIsDev } from '@/src/helpers/useIsDev';

export const NotificationSettings = () => {
  const [token, setToken] = useState<string | null>();
  const me = useMe();
  const isDev = useIsDev();

  //TODO: refactor to check notif permissions locally, rather than requesting notif access right away
  useEffect(() => {
    void registerForPushNotificationsAsync().then((t) => {
      setToken(t ? (isDev ? `${t} DEV` : t) : null);
    });
    // now get existing value from server
  }, [isDev]);

  const userId = me?.id;
  const canEditNotifications = typeof token === 'string' && !!userId;

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
      {token === undefined ? (
        <View testID="notification-toggle-loading">
          <AppLoadingIndicator size="small" />
        </View>
      ) : (
        <View testID="notification-toggle-settled">
          {!canEditNotifications ? (
            <Switch
              accessibilityLabel="Allow notifications"
              testID="notification-toggle-unavailable"
              disabled={true}
            />
          ) : (
            <NotificationToggle token={token} userId={userId} />
          )}
        </View>
      )}
    </View>
  );
};

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
  const allow = result.data?.userDevices[0]?.enabled;
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

  if (allow === undefined) {
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
