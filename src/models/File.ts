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

  @Column({ type: DataType.INTEGER })
  declare fileSize: number; // width / height (used for sizing on screen elements before image is loaded

  @Column
  declare fileLastModified: Date;

  @ForeignKey(() => Folder)
  @Column
  folderId: number;

  fullPath() {
    return fullPath(this.relativePath) + sep + this.name;
  }
}
