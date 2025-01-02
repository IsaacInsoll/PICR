import { DataTypes, Model } from '@sequelize/core';
import {
  Attribute,
  ForeignKey,
  Table,
} from '@sequelize/core/decorators-legacy';
import Folder from './Folder';
import User from './User';
import File from './File';

@Table
export default class Comment extends Model {
  @ForeignKey(() => Folder)
  @Attribute(DataTypes.INTEGER)
  folderId: number;

  @ForeignKey(() => File)
  @Attribute(DataTypes.INTEGER)
  fileId: number;

  @ForeignKey(() => User)
  @Attribute(DataTypes.INTEGER)
  userId: number;

  @Attribute(DataTypes.BOOLEAN)
  declare systemGenerated: boolean; // EG: recording change of star rating / flag

  @Attribute(DataTypes.STRING)
  declare nickName: string; // user-entered name (optional)

  @Attribute(DataTypes.TEXT)
  declare comment: string;
}

export const CommentFor = async (
  file: File,
  user: User,
  systemGenerated?: object,
) => {
  const c = new Comment();
  c.folderId = file.folderId;
  c.fileId = file.id;
  c.userId = user.id;
  if (systemGenerated) {
    c.systemGenerated = true;
    c.comment = JSON.stringify(systemGenerated);
    await c.save();
  } else {
    c.systemGenerated = false;
  }
  return c;
};
