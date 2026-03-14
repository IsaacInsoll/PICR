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
  const [token, setToken] = useState<string>('');
  const me = useMe();
  const isDev = useIsDev();

  //TODO: refactor to check notif permissions locally, rather than requesting notif access right away
  useEffect(() => {
    void registerForPushNotificationsAsync().then((t) => {
      setToken(isDev ? `${t ?? ''} DEV` : (t ?? ''));
    });
    // now get existing value from server
  }, [isDev]);

  const userId = me?.id;
  const canEditNotifications = token !== '' && !!userId;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
      }}
    >
      <PText>Allow Notifications</PText>
      {!canEditNotifications ? (
        <Switch disabled={true} />
      ) : (
        <NotificationToggle token={token} userId={userId} />
      )}
    </View>
  );
};

const NotificationToggle = ({
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

  const onChange = async (enabled: boolean) => {
    await mutate({
      enabled,
      token,
      userId,
      name: Device.modelName ?? 'Mobile Device',
    });
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
      value={allow}
      onChange={(event) => handleChange(event.nativeEvent.value)}
    />
  );
};
