import Folder from '../../models/Folder';
import File from '../../models/File';

export const getFolder = async (id: string) => {
  const folder = await Folder.findByPk(id);
  const data = folder.toJSON();
  data.subFolders = await subFolders(id);
  data.files = await subFiles(id);
  return data;
};

export const subFolders = async (parentId: string) => {
  const folders = await Folder.findAll({ where: { parentId } });
  return folders.map((f) => f.toJSON());
};

export const subFiles = async (folderId: string) => {
  const files = await File.findAll({ where: { folderId } });
  return files.map((f) => {
    // this was just f.toJSON but all metadata is a single field in the DB currently coz it's 'modular' not 'dodgy'
    return fileToJSON(f);
  });
};

export const fileToJSON = (f: File) => {
  return { ...f.toJSON(), metadata: JSON.parse(f.metadata) };
};
