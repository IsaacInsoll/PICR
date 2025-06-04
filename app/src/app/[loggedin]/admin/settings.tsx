import { Button, StyleSheet, Text, View } from 'react-native';
import { AppBrandedBackground } from '@/src/components/AppBrandedBackground';
import { PicrLogo } from '@/src/components/PicrLogo';
import { useLoginDetails, useSetLoggedOut } from '@/src/hooks/useLoginDetails';
import { serverInfoQuery } from '@frontend/urql/queries/serverInfoQuery';
import { useQuery } from 'urql';
import { useMe } from '@/src/hooks/useMe';

export default function Settings() {
  const logout = useSetLoggedOut();
  return (
    <AppBrandedBackground>
      <ServerDetails />
      <View style={{ marginBottom: 32 }}>
        <Button onPress={logout} title="Log out" />
      </View>
    </AppBrandedBackground>
  );
}

const ServerDetails = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const login = useLoginDetails();
  const me = useMe();
  const details = result.data?.serverInfo;
  return (
    <View style={styles.settingsView}>
      <PicrLogo />
      <Text>{login?.server}</Text>
      <Text>{me?.name}</Text>
      <Text>Server Version {details?.version}</Text>
      <Text>Latest Server Version {details?.latest}</Text>
      <Text>TODO: app version</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  settingsView: {
    paddingTop: 32,
    alignItems: 'center',
    gap: 16,
    flexGrow: 1,
  },
});
