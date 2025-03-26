import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import FolderModel from './FolderModel';
import { FileFlag, FileType } from '../../graphql-types';
import { fullPath } from '../filesystem/fileManager';
import { sep } from 'path';

@Table({ tableName: 'Files' })
export default class FileModel extends Model {
  @Column
  declare name: string;
  @Column
  declare fileHash: string;

  @Column
  declare blurHash: string; // string for Images describing its 'micro thumbnail' https://www.npmjs.com/package/blurhash
  @Column
  declare relativePath: string;

  @Column({ type: DataType.TEXT })
  declare metadata: string; //dodgy JSON string of type `MetadataSummary.ts`

  @Column({ type: DataType.ENUM(...Object.values(FileType)) })
  declare type: FileType;

  @Column({ type: DataType.ENUM(...Object.values(FileFlag)) })
  declare flag: FileFlag;

  @Column({ type: DataType.INTEGER })
  declare rating: number; // 0-5

  @Column({ type: DataType.FLOAT })
  declare imageRatio: number; // width / height (used for sizing on screen elements before image is loaded

  @Column({ type: DataType.FLOAT })
  declare duration: number; // seconds (video files)

  @Column({ type: DataType.BIGINT })
  declare fileSize: number;

  @Column
  declare fileLastModified: Date;

  @Column
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down

  @Column({ type: DataType.INTEGER })
  declare totalComments: number; //we could calculate it but this is faster and easier

  @Column
  declare latestComment: Date;

  @ForeignKey(() => FolderModel)
  @Column
  folderId: number;

  fullPath() {
    return fullPath(this.relativePath) + sep + this.name;
  }

  //Gives path relative to another path, useful to remove 'ZIP root folder' when zipping
  fullPathMinus(path: string) {
    return this.relativePath.replace(path, '') + sep + this.name;
  }
}
