import File from '../models/File';

export const thumbnailForFolder = async (folderId: number): Promise<File> => {
  // we will eventually have a 'preferred/selected' image, for now just show the first one
  return await File.findOne({ where: { folderId: folderId, type: 'Image' } });
};
