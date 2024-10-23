import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Folder from './Folder';
import { FileFlag, FileType } from '../../graphql-types';
import { fullPath } from '../filesystem/fileManager';
import { sep } from 'path';

@Table
export default class File extends Model {
  @Column(DataType.TEXT)
  declare name: string;
  @Column(DataType.TEXT)
  declare fileHash: string;

  @Column(DataType.TEXT)
  declare blurHash: string; // string for Images describing its 'micro thumbnail' https://www.npmjs.com/package/blurhash
  @Column(DataType.TEXT)
  declare relativePath: string;

  @Column({ type: DataType.TEXT })
  declare metadata: string; //dodgy JSON string of type `MetadataSummary.ts`

  @Column({ type: DataType.ENUM(...Object.values(FileType)) })
  declare type: FileType; //dodgy JSON string of type `MetadataSummary.ts`

  @Column({ type: DataType.ENUM(...Object.values(FileFlag)) })
  declare flag: FileFlag; //dodgy JSON string of type `MetadataSummary.ts`

  @Column({ type: DataType.INTEGER })
  declare rating: number; // 0-5

  @Column({ type: DataType.FLOAT })
  declare imageRatio: number; // width / height (used for sizing on screen elements before image is loaded

  @Column({ type: DataType.FLOAT })
  declare duration: number; // seconds (video files)

  @Column({ type: DataType.BIGINT })
  declare fileSize: number;

  @Column(DataType.DATE)
  declare fileLastModified: Date;

  @Column(DataType.BOOLEAN)
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down

  @Column({ type: DataType.INTEGER })
  declare totalComments: number; //we could calculate it but this is faster and easier

  @Column(DataType.DATE)
  declare latestComment: Date;

  @ForeignKey(() => Folder)
  @Column(DataType.INTEGER)
  folderId: number;

  fullPath() {
    return fullPath(this.relativePath) + sep + this.name;
  }

  //Gives path relative to another path, useful to remove 'ZIP root folder' when zipping
  fullPathMinus(path: string) {
    return this.relativePath.replace(path, '') + sep + this.name;
  }
}
