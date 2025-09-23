import { PText } from '@/src/components/PText';
import { SettingsData } from '@/src/app/[loggedin]/admin/settings';
import {
  Host,
  HStack,
  Label,
  List,
  Slider,
  Section,
  Text,
  VStack,
} from '@expo/ui/swift-ui';

export const SettingsScreen = ({ data }: { data: SettingsData }) => {
  const { server, serverVersion, serverLatest, me } = data;

  return (
    <>
      <Host style={{ height: '100%', width: '100%' }}>
        {/*<VStack>*/}
        <List>
          <Section title="Server">
            <Text>{server}</Text>
            <Text>{me}</Text>
            <Text>{`Version: ${serverVersion} (latest is ${serverLatest})`}</Text>
          </Section>
          {/*</VStack>*/}
          {/*</Label>*/}
        </List>
      </Host>
    </>
  );
};
