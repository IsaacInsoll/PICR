import File from '../../models/File';

export const fileToJSON = (f: File) => {
  return { ...f.toJSON(), metadata: JSON.parse(f.metadata) };
};