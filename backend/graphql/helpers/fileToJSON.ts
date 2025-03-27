import FileModel from '../../db/sequelize/FileModel';

export const fileToJSON = (f: FileModel) => {
  return { ...f.toJSON(), metadata: JSON.parse(f.metadata) };
};
