import FileModel from '../../db/FileModel';

import { fileToJSON } from './fileToJSON';
import { FileInterface } from '../../../graphql-types';

export const subFiles = async (folderId: string | number) => {
  const files = await FileModel.findAll({
    where: { folderId, exists: true },
    order: [['name', 'ASC']],
  });
  return files.map((f) => {
    // this was just f.toJSON but all metadata is a single field in the DB currently coz it's 'modular' not 'dodgy'
    return fileToJSON(f);
  });
};

export const subFilesMap = async (folderId: string | number) => {
  const files = await FileModel.findAll({
    where: { folderId, exists: true },
    order: [['name', 'ASC']],
  });
  const obj: { [key: string]: FileInterface } = {};
  files.forEach((f) => {
    obj[f.id] = f.toJSON();
  });
  return obj;
};
