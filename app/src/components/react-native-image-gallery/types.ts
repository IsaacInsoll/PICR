import React from 'react';
import { ImageResizeMode } from 'react-native';

export interface IProps {
  close: () => void;
  hideThumbs?: boolean;
  images: ImageObject[];
  initialIndex?: number;
  isOpen: boolean;
  resizeMode?: ImageResizeMode;
  thumbColor?: string;
  thumbSize?: number;
  thumbResizeMode?: ImageResizeMode;
  disableSwipe?: boolean;

  renderCustomThumb?: (
    item: ImageObject,
    index: number,
    isSelected: boolean
  ) => React.ReactNode;

  renderCustomImage?: (
    item: ImageObject,
    index: number,
    isSelected: boolean
  ) => React.ReactNode;

  renderHeaderComponent?: (
    item: ImageObject,
    currentIndex: number
  ) => React.ReactNode;

  renderFooterComponent?: (
    item: ImageObject,
    currentIndex: number
  ) => React.ReactNode;
}

export interface HeaderProps {
  currentIndex: number;
  item?: ImageObject;
}

export interface FooterProps {
  currentIndex: number;
  total: number;
}

export interface ImageObject {
  id?: string | number;
  thumbUrl?: string;
  url: string;
}

export interface ImagePreviewProps {
  index: number;
  isSelected: boolean;
  item: ImageObject;
  resizeMode?: ImageResizeMode;

  renderCustomImage?: (
    item: ImageObject,
    index: number,
    isSelected: boolean
  ) => React.ReactNode;
}

export interface RenderImageProps {
  item: ImageObject;
  index: number;
  resizeMode?: ImageResizeMode;
}
