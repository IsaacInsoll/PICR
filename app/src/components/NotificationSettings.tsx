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

export const NotificationSettings = () => {
  const [token, setToken] = useState<string | undefined>(undefined);
  const me = useMe();

  const [result, requery] = useQuery({
    query: userDeviceQuery,
    variables: { userId: me.id, token: token },
    pause: !token || !me.id,
  });

  const [, mutate] = useMutation(editUserDeviceMutation);

  const allow = result.data?.userDevices[0]?.enabled ?? false;

  //TODO: refactor to check notif permissions locally, rather than requesting notif access right away
  useEffect(() => {
    registerForPushNotificationsAsync().then(setToken);
    // now get existing value from server
  }, []);

  const onChange = async (enabled: boolean) => {
    console.log(1);
    if (!token || !me.id) return;
    console.log(2);
    await mutate({
      enabled,
      token,
      userId: me.id,
      name: Device.modelName ?? 'Mobile Device',
    }).then((x) => {
      console.log(x);
      requery({ requestPolicy: 'cache-and-network' });
    });
  };

  console.log({ token, allow });

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
      {token == undefined ? (
        <Switch disabled={true} />
      ) : allow == undefined ? (
        <AppLoadingIndicator size="small" />
      ) : (
        <Switch
          value={allow}
          onChange={(event) => onChange(event.nativeEvent.value)}
        />
      )}
    </View>
  );
};
