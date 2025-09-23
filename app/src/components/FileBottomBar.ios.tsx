import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAtomValue } from 'jotai';
import { fileViewFullscreenAtom } from '@/src/atoms/atoms';
import { PText } from '@/src/components/PText';
import { View } from 'react-native';
import {
  Button,
  GlassEffectContainer,
  Host,
  HStack,
  Text,
} from '@expo/ui/swift-ui';

export const FileBottomBar = ({ file }) => {
  const theme = useAppTheme();
  const fullScreen = useAtomValue(fileViewFullscreenAtom);
  // const safe = useSafeAreaInsets();
  if (fullScreen) return null;
  return (
    <Host
      // matchContents={true}
      style={{
        position: 'absolute',
        // bottom: safe.bottom,
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        // backgroundColor: '#ff0000',
      }}
    >
      <GlassEffectContainer>
        <HStack spacing={32}>
          <Text>Hi from Swift UI</Text>
          <Button variant="glass">yo dawg</Button>
        </HStack>
      </GlassEffectContainer>
    </Host>
  );
};
