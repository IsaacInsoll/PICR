import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import FolderModel from './FolderModel';
import UserModel from './UserModel';
import FileModel from './FileModel';

@Table({ tableName: 'Comments' })
export default class CommentModel extends Model {
  @ForeignKey(() => FolderModel)
  @Column
  folderId: number;

  @ForeignKey(() => FileModel)
  @Column
  fileId: number;

  @ForeignKey(() => UserModel)
  @Column
  userId: number;

  @Column
  declare systemGenerated: boolean; // EG: recording change of star rating / flag

  @Column
  declare nickName: string; // user-entered name (optional)

  @Column({ type: DataType.TEXT })
  declare comment: string;
}

export const CommentFor = async (
  file: FileModel,
  user: UserModel,
  systemGenerated?: object,
) => {
  const c = new CommentModel();
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
