import { logger } from '../logger.js';
import { openSharp } from './openSharp.js';

export const getImageRatio = async (filePath: string) => {
  try {
    const image = openSharp(filePath);
    const { width, height } = await image.metadata();
    if (!height || !width) return 0;
    return height > 0 ? width / height : 0;
  } catch (error) {
    logger.error('getImageRatio failed for ' + filePath);
    console.error(error);
    return 0;
  }
};
