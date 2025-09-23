import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAtom } from 'jotai';
import { fileViewFullscreenAtom } from '@/src/atoms/atoms';
import { View } from 'react-native';
import { Button, GlassEffectContainer, Host, HStack } from '@expo/ui/swift-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animation,
  animation,
  hidden,
  matchedGeometryEffect,
} from '@expo/ui/swift-ui/modifiers';

export const FileBottomBar = ({ file, onComments, onInfo }) => {
  const theme = useAppTheme();
  const [fullScreen, setFullscreen] = useAtom(fileViewFullscreenAtom);
  const safe = useSafeAreaInsets();

  // if (fullScreen) return null;

  // I can't work out how to prevent the tap gesture from propagating up above this component and triggering PBigImage togglefullscreen
  return (
    <View
      // glassEffectStyle="clear" // too obnoxious
      style={{
        position: 'absolute',
        bottom: safe.bottom,
        left: 16,
        right: 16,
        padding: 24,
        borderRadius: 32,
        zIndex: 1000,
      }}
    >
      <Host
      // matchContents={true}
      >
        <GlassEffectContainer
          spacing={32}
          modifiers={[
            animation(Animation.spring({ duration: 0.3 }), fullScreen ? 0 : 1),
            matchedGeometryEffect('yo', 'dawg'),
            // hidden(fullScreen),
          ]}
        >
          <HStack spacing={32} modifiers={[hidden(fullScreen)]}>
            {/*<GlassEffectContainer*/}
            {/*  spacing={30}*/}
            {/*  modifiers={[*/}
            {/*    padding({ all: 30 }),*/}
            {/*    cornerRadius(20),*/}
            {/*  ]}*/}
            {/*>*/}
            <Button
              systemImage={'message' ?? 'message.badge'}
              onPress={() => console.log}
              variant={fullScreen ? undefined : 'glass'}
            >
              Comments
            </Button>
            <Button
              systemImage="info.circle"
              onPress={async () => {
                console.log('info.circle');
                onInfo();
              }}
              variant={fullScreen ? undefined : 'glass'}
            >
              File info
            </Button>
            {/*</GlassEffectContainer>*/}
          </HStack>
        </GlassEffectContainer>
      </Host>
    </View>
  );
};
