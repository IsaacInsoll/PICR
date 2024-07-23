import sharp from 'sharp';

export const getImageRatio = async (filePath: string) => {
  const image = sharp(filePath);
  const { width, height } = await image.metadata();
  return height > 0 ? width / height : 0;
};