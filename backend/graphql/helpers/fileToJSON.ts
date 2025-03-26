import FileModel from '../../db/FileModel';

export const fileToJSON = (f: FileModel) => {
  return { ...f.toJSON(), metadata: JSON.parse(f.metadata) };
};
