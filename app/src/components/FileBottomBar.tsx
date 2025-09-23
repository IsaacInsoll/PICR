import { useAppTheme } from '@/src/hooks/useAppTheme';
import { useAtomValue } from 'jotai';
import { fileViewFullscreenAtom } from '@/src/atoms/atoms';
import { BlurView } from 'expo-blur';
import { PText } from '@/src/components/PText';

export const FileBottomBar = ({ file }) => {
  const theme = useAppTheme();
  const fullScreen = useAtomValue(fileViewFullscreenAtom);
  // const safe = useSafeAreaInsets();
  if (fullScreen) return null;
  return (
    <BlurView
      intensity={90}
      tint="dark"
      experimentalBlurMethod="dimezisBlurView"
      style={{
        position: 'absolute',
        // bottom: safe.bottom,
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        // backgroundColor: theme.backgroundColor,
      }}
    >
      <PText variant="code">
        TODO: Nice android version :P Viewing file {file.id} with ratio{' '}
        {file.imageRatio}
      </PText>
    </BlurView>
  );
};
