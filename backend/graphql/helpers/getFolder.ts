import FolderModel from '../../db/FolderModel';

export const getFolder = async (id: string | number) => {
  const folder = await FolderModel.findByPk(id);
  return folder.toJSON();
};
