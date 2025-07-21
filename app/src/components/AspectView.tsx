// returns a view matching the aspect ratio.
// width can be specified or implied
import { ReactNode, useState } from 'react';
import { View } from 'react-native';
import { PText } from '@/src/components/PText';

export const AspectView = ({
  width: widthProp,
  ratio,
  children,
}: {
  width?: number;
  ratio?: number;
  children: ReactNode;
}) => {
  const [viewWidth, setViewWidth] = useState(0);
  const width = widthProp ?? viewWidth;
  const height = width / (ratio ?? 1);
  // console.log([width, height, ratio]);
  return (
    <View
      onLayout={(e) => {
        const ww = e.nativeEvent.layout.width;
        console.log('ww', ww);
        if (!widthProp && ww != viewWidth) setViewWidth(ww);
      }}
      style={{ height, width: widthProp }}
    >
      {false ? (
        <PText>
          {width}x{height}
        </PText>
      ) : (
        children
      )}
    </View>
  );
};
