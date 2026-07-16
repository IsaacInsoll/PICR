import type {
  ImageExtended,
  Image,
  BuildLayoutOptions,
  ImageExtendedRow,
} from './types';

const getRow = <T extends Image = Image>(
  images: T[],
  { containerWidth, rowHeight, margin }: BuildLayoutOptions,
): [ImageExtendedRow<T>, T[]] => {
  const effectiveRowHeight = rowHeight ?? 180;
  const effectiveMargin = margin ?? 2;
  const row: ImageExtendedRow<T> = [];
  const imgMargin = 2 * effectiveMargin;
  const items = [...images];

  let totalRowWidth = 0;
  while (items.length > 0 && totalRowWidth < containerWidth) {
    const item = items.shift();
    if (!item) break;
    const scaledWidth = Math.floor(
      effectiveRowHeight * (item.width / item.height),
    );
    const extendedItem: ImageExtended<T> = {
      ...item,
      scaledHeight: effectiveRowHeight,
      scaledWidth,
      viewportWidth: scaledWidth,
      marginLeft: 0,
    };
    row.push(extendedItem);
    totalRowWidth += extendedItem.scaledWidth + imgMargin;
  }

  // Justify by rescaling the whole row to fit the container (standard
  // justified-gallery behaviour) instead of horizontally cropping each image.
  // Cropping cut into compositions: subjects on a rule-of-thirds line lost a
  // flank of the frame, which read as badly framed thumbnails to clients.
  const protrudingWidth = totalRowWidth - containerWidth;
  if (row.length > 0 && protrudingWidth > 0) {
    const marginsWidth = row.length * imgMargin;
    const availableWidth = containerWidth - marginsWidth;
    const naturalWidth = totalRowWidth - marginsWidth;
    const scale = availableWidth / naturalWidth;
    const scaledRowHeight = Math.floor(effectiveRowHeight * scale);
    let usedWidth = 0;
    for (const item of row) {
      item.scaledHeight = scaledRowHeight;
      item.scaledWidth = Math.floor(item.scaledWidth * scale);
      usedWidth += item.scaledWidth;
    }
    // Hand the flooring remainder back one pixel at a time so the row fills
    // the container edge-to-edge without ever overflowing it (overflow would
    // break the flex-wrap row alignment).
    let leftover = availableWidth - usedWidth;
    for (const item of row) {
      if (leftover <= 0) break;
      item.scaledWidth += 1;
      leftover -= 1;
    }
    for (const item of row) {
      item.viewportWidth = item.scaledWidth;
      item.marginLeft = 0;
    }
  }

  return [row, items];
};

const getRows = <T extends Image = Image>(
  images: T[],
  options: BuildLayoutOptions,
  rows: ImageExtendedRow<T>[] = [],
): ImageExtendedRow<T>[] => {
  const [row, imagesLeft] = getRow(images, options);
  const nextRows = [...rows, row];

  if (options.maxRows && nextRows.length >= options.maxRows) {
    return nextRows;
  }
  if (imagesLeft.length) {
    return getRows(imagesLeft, options, nextRows);
  }
  return nextRows;
};

export const buildLayout = <T extends Image = Image>(
  images: T[],
  { containerWidth, maxRows, rowHeight, margin }: BuildLayoutOptions,
): ImageExtendedRow<T>[] => {
  rowHeight = typeof rowHeight === 'undefined' ? 180 : rowHeight;
  margin = typeof margin === 'undefined' ? 2 : margin;

  if (!containerWidth) return [];

  const options = { containerWidth, maxRows, rowHeight, margin };
  return getRows(images, options);
};

export const buildLayoutFlat = <T extends Image = Image>(
  images: T[],
  options: BuildLayoutOptions,
): ImageExtendedRow<T> => {
  const rows = buildLayout(images, options);
  return ([] as ImageExtendedRow<T>).concat(...rows);
};
