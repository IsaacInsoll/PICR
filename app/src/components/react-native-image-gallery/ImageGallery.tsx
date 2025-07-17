// FROM https://github.com/georstat/react-native-image-gallery/issues/22

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageObject, IProps, RenderImageProps } from './types';
import ImagePreview from './ImagePreview';
import SwipeContainer from './SwipeContainer';

const { height: deviceHeight, width: deviceWidth } = Dimensions.get('window');

const ImageGallery = ({
  hideThumbs = false,
  resizeMode = 'contain',
  thumbColor = '#d9b44a',
  thumbResizeMode = 'cover',
  thumbSize = 48,
  close,
  images,
  initialIndex,
  isOpen,
  renderCustomImage,
  renderCustomThumb,
  renderFooterComponent,
  renderHeaderComponent,
  disableSwipe,
}: IProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const topRef = useRef<FlatList>(null);
  const bottomRef = useRef<FlatList>(null);

  const keyExtractorThumb = (item: ImageObject, index: number) =>
    item && item.id ? item.id.toString() : index.toString();
  const keyExtractorImage = (item: ImageObject, index: number) =>
    item && item.id ? item.id.toString() : index.toString();

  const scrollToIndex = (i: number) => {
    setActiveIndex(i);

    if (topRef?.current) {
      topRef.current.scrollToIndex({
        animated: true,
        index: i,
      });
    }
    if (bottomRef?.current) {
      if (i * (thumbSize + 10) - thumbSize / 2 > deviceWidth / 2) {
        bottomRef?.current?.scrollToIndex({
          animated: true,
          index: i,
        });
      } else {
        bottomRef?.current?.scrollToIndex({
          animated: true,
          index: 0,
        });
      }
    }
  };

  const renderItem = ({ item, index }: RenderImageProps) => {
    return (
      <ImagePreview
        index={index}
        isSelected={activeIndex === index}
        item={item}
        resizeMode={resizeMode}
        renderCustomImage={renderCustomImage}
      />
    );
  };

  const renderThumb = ({ item, index }: RenderImageProps) => {
    return (
      <TouchableOpacity
        onPress={() => scrollToIndex(index)}
        activeOpacity={0.8}
      >
        {renderCustomThumb ? (
          renderCustomThumb(item, index, activeIndex === index)
        ) : (
          <Image
            resizeMode={thumbResizeMode}
            style={
              activeIndex === index
                ? [
                    styles.thumb,
                    styles.activeThumb,
                    { borderColor: thumbColor },
                    { width: thumbSize, height: thumbSize },
                  ]
                : [styles.thumb, { width: thumbSize, height: thumbSize }]
            }
            source={{ uri: item.thumbUrl ? item.thumbUrl : item.url }}
          />
        )}
      </TouchableOpacity>
    );
  };

  const onMomentumEnd = (e: any) => {
    const { x } = e.nativeEvent.contentOffset;
    scrollToIndex(Math.round(x / deviceWidth));
  };

  useEffect(() => {
    if (isOpen && initialIndex) {
      setActiveIndex(initialIndex);
    } else if (!isOpen) {
      setActiveIndex(0);
    }
  }, [isOpen, initialIndex]);

  // @ts-ignore This came from a third-party library. IDK what the intent is.
  const getImageLayout = useCallback((_, index) => {
    return {
      index,
      length: deviceWidth,
      offset: deviceWidth * index,
    };
  }, []);

  const getThumbLayout = useCallback(
    // @ts-ignore This came from a third-party library. IDK what the intent is.
    (_, index) => {
      return {
        index,
        length: thumbSize,
        offset: thumbSize * index,
      };
    },
    [thumbSize],
  );

  return (
    <Modal animationType={isOpen ? 'slide' : 'fade'} visible={isOpen}>
      <View style={styles.container}>
        <SwipeContainer
          disableSwipe={disableSwipe}
          setIsDragging={setIsDragging}
          close={close}
        >
          <FlatList
            initialScrollIndex={initialIndex}
            getItemLayout={getImageLayout}
            data={images}
            horizontal
            keyExtractor={keyExtractorImage}
            onMomentumScrollEnd={onMomentumEnd}
            pagingEnabled
            ref={topRef}
            renderItem={renderItem}
            scrollEnabled={!isDragging}
            showsHorizontalScrollIndicator={false}
          />
        </SwipeContainer>
        {hideThumbs ? null : (
          <FlatList
            initialScrollIndex={initialIndex}
            getItemLayout={getThumbLayout}
            contentContainerStyle={styles.thumbnailListContainer}
            data={images}
            horizontal
            keyExtractor={keyExtractorThumb}
            pagingEnabled
            ref={bottomRef}
            renderItem={renderThumb}
            showsHorizontalScrollIndicator={false}
            style={[styles.bottomFlatlist, { bottom: thumbSize }]}
          />
        )}
        {renderHeaderComponent ? (
          <View style={styles.header}>
            {renderHeaderComponent(images[activeIndex], activeIndex)}
          </View>
        ) : null}
        {renderFooterComponent ? (
          <View style={styles.footer}>
            {renderFooterComponent(images[activeIndex], activeIndex)}
          </View>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: 'black',
    flex: 1,
    height: deviceHeight,
    justifyContent: 'center',
    width: deviceWidth,
  },

  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  footer: {
    bottom: 0,
    position: 'absolute',
    width: '100%',
  },
  activeThumb: {
    borderWidth: 3,
  },
  thumb: {
    borderRadius: 12,
    marginRight: 10,
  },
  thumbnailListContainer: {
    paddingHorizontal: 10,
  },
  bottomFlatlist: {
    position: 'absolute',
  },
});

export default ImageGallery;
