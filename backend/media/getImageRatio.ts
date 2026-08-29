import { logger } from '../logger.js';
import { openSharp } from './openSharp.js';

export const getImageRatio = async (filePath: string) => {
  try {
    const image = openSharp(filePath);
    const { autoOrient } = await image.metadata();
    const { width: displayedWidth, height: displayedHeight } = autoOrient;
    if (!displayedHeight || !displayedWidth) return 0;
    return displayedHeight > 0 ? displayedWidth / displayedHeight : 0;
  } catch (error) {
    logger.error('getImageRatio failed for ' + filePath);
    logger.error(String(error));
    return 0;
  }
};
