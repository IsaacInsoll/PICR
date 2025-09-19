import { PText } from '@/src/components/PText';
import { SettingsData } from '@/src/app/[loggedin]/admin/settings';
import { PTitle } from '@/src/components/PTitle';
import { View } from 'react-native';

export const SettingsScreen = ({ data }: { data: SettingsData }) => {
  const { server, serverVersion, serverLatest, me } = data;
  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <PTitle level={3}>Server</PTitle>
      <PText>{server}</PText>
      <PText>{me}</PText>
      <PText>
        Server Version {serverVersion} (Latest is {serverLatest})
      </PText>
    </View>
  );
};
