import sharp from 'sharp';

export const getImageRatio = async (filePath: string) => {
  const image = sharp(filePath);
  const { width, height } = await image.metadata();
  if (!height || !width) return 0;
  return height > 0 ? width / height : 0;
};