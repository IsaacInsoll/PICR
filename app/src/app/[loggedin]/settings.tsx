import { Button, Text, View } from 'react-native';
import { PicrBackground } from '@/src/components/PicrBackground';
import { PicrLogo } from '@/src/components/PicrLogo';
import { useLoginDetails, useSetLoggedOut } from '@/src/hooks/useLoginDetails';
import { serverInfoQuery } from '@frontend/urql/queries/serverInfoQuery';
import { useQuery } from 'urql';

export default function Settings() {
  const logout = useSetLoggedOut();
  return (
    <PicrBackground>
      <ServerDetails />
      <View style={{ marginBottom: 32 }}>
        <Button onPress={logout} title="Log out" />
      </View>
    </PicrBackground>
  );
}

const ServerDetails = () => {
  const [result] = useQuery({ query: serverInfoQuery });
  const me = useLoginDetails();
  console.log(result);
  const details = result.data?.serverInfo;
  return (
    <View
      style={{
        paddingTop: 32,
        alignItems: 'center',
        gap: 16,
        flexGrow: 1,
      }}
    >
      <PicrLogo />
      <Text>{me?.server}</Text>
      <Text>{me?.username}</Text>
      <Text>Version {details?.version}</Text>
      <Text>Latest {details?.latest}</Text>
    </View>
  );
};
