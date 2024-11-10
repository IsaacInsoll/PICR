import Folder from '../../models/Folder';
import File from '../../models/File';

export const heroImageForFolder = async (f: Folder) => {
  const heroImage =
    f.heroImageId != 0 ? await File.findByPk(f.heroImageId) : undefined;
  if (!heroImage || !heroImage.exists || !heroImage.folderId != f.id) {
    const first = await File.findOne({
      where: { folderId: f.id, type: 'Image', exists: true },
      order: [['name']],
    });
    // console.log(f.relativePath + ' no hero image so found: ' + first?.name);
    return first;
  } else {
    // console.log(f.relativePath + ' has hero image: ' + heroImage?.name);
    return heroImage;
  }
};
