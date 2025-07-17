import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ImagePreviewProps } from './types';

const { height, width } = Dimensions.get('window');

const ImagePreview = ({
  index,
  isSelected,
  item,
  renderCustomImage,
  resizeMode,
}: ImagePreviewProps) => {
  return (
    <View>
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.containerStyle}>
          {renderCustomImage ? (
            renderCustomImage(item, index, isSelected)
          ) : (
            <Image
              resizeMode={resizeMode}
              source={{ uri: item.url }}
              style={styles.image}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    height,
    width,
  },
  image: {
    height: '100%',
    width: '100%',
  },
});

export default ImagePreview;
