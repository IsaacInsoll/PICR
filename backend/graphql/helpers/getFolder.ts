import Folder from '../../models/Folder';

export const getFolder = async (id: string | number) => {
  const folder = await Folder.findByPk(id);
  return folder.toJSON();
};
