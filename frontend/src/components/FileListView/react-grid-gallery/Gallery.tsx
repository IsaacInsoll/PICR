import type { MouseEvent } from 'react';
import { Image } from './Image';
import { useContainerWidth } from './useContainerWidth';
import { buildLayoutFlat, buildMasonryColumns } from './buildLayout';
import type { Image as ImageInterface, GalleryProps } from './types';
import * as styles from './styles';

export const Gallery = <T extends ImageInterface>({
  images,
  id = 'ReactGridGallery',
  enableImageSelection = true,
  onSelect = () => {},
  rowHeight = 180,
  layout = 'justified',
  maxRows,
  margin = 2,
  defaultContainerWidth = 0,
  onClick = () => {},
  tileViewportStyle,
  thumbnailStyle,
  tagStyle,
  thumbnailImageComponent,
}: GalleryProps<T>) => {
  const { containerRef, containerWidth } = useContainerWidth(
    defaultContainerWidth,
  );

  const thumbnails = buildLayoutFlat<T>(images, {
    containerWidth,
    maxRows,
    rowHeight,
    margin,
  });

  const handleSelect = (index: number, event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onSelect(index, images[index], event);
  };

  const handleClick = (index: number, event: MouseEvent<HTMLElement>) => {
    onClick(index, images[index], event);
  };

  if (layout === 'masonry') {
    const columns = buildMasonryColumns<T>(images, {
      containerWidth,
      columnWidth: rowHeight,
      margin,
    });
    return (
      <div id={id} className="ReactGridGallery" ref={containerRef}>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {columns.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column' }}>
              {col.map((item) => (
                <Image
                  key={item.key || item.originalIndex}
                  item={item}
                  index={item.originalIndex}
                  margin={margin}
                  height={item.scaledHeight}
                  isSelectable={enableImageSelection}
                  onClick={handleClick}
                  onSelect={handleSelect}
                  tagStyle={tagStyle}
                  tileViewportStyle={tileViewportStyle}
                  thumbnailStyle={thumbnailStyle}
                  thumbnailImageComponent={thumbnailImageComponent}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id={id} className="ReactGridGallery" ref={containerRef}>
      <div style={styles.gallery}>
        {thumbnails.map((item, index) => (
          <Image
            key={item.key || index}
            item={item}
            index={index}
            margin={margin}
            height={rowHeight}
            isSelectable={enableImageSelection}
            onClick={handleClick}
            onSelect={handleSelect}
            tagStyle={tagStyle}
            tileViewportStyle={tileViewportStyle}
            thumbnailStyle={thumbnailStyle}
            thumbnailImageComponent={thumbnailImageComponent}
          />
        ))}
      </div>
    </div>
  );
};

Gallery.displayName = 'Gallery';
