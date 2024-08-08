import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import Folder from './Folder';
import { FileType } from '../../graphql-types';
import { fullPath } from '../filesystem/fileManager';
import { sep } from 'path';

@Table
export default class File extends Model {
  @Column
  declare name: string;
  @Column
  declare fileHash: string;
  @Column
  declare relativePath: string;

  @Column({ type: DataType.TEXT })
  declare metadata: string; //dodgy JSON string of type `MetadataSummary.ts`

  @Column({ type: DataType.ENUM(...Object.values(FileType)) })
  declare type: FileType; //dodgy JSON string of type `MetadataSummary.ts`

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

  @ForeignKey(() => Folder)
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
