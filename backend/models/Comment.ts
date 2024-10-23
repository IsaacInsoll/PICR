import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Folder from './Folder';
import User from './User';
import File from './File';

@Table
export default class Comment extends Model {
  @ForeignKey(() => Folder)
  @Column(DataType.INTEGER)
  folderId: number;

  @ForeignKey(() => File)
  @Column(DataType.INTEGER)
  fileId: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @Column(DataType.BOOLEAN)
  declare systemGenerated: boolean; // EG: recording change of star rating / flag

  @Column(DataType.STRING)
  declare nickName: string; // user-entered name (optional)

  @Column({ type: DataType.TEXT })
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
