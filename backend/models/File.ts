import { DataTypes, Model } from '@sequelize/core';
import {
  Attribute,
  ForeignKey,
  Table,
} from '@sequelize/core/decorators-legacy';
import Folder from './Folder';
import { FileFlag, FileType } from '../../graphql-types';
import { fullPath } from '../filesystem/fileManager';
import { sep } from 'path';

@Table
export default class File extends Model {
  @Attribute(DataTypes.STRING)
  declare name: string;
  @Attribute(DataTypes.STRING)
  declare fileHash: string;

  @Attribute(DataTypes.STRING)
  declare blurHash: string; // string for Images describing its 'micro thumbnail' https://www.npmjs.com/package/blurhash
  @Attribute(DataTypes.STRING)
  declare relativePath: string;

  @Attribute(DataTypes.TEXT)
  declare metadata: string; //dodgy JSON string of type `MetadataSummary.ts`

  @Attribute(DataTypes.ENUM(...Object.values(FileType)))
  declare type: FileType; //dodgy JSON string of type `MetadataSummary.ts`

  @Attribute(DataTypes.ENUM(...Object.values(FileFlag)))
  declare flag: FileFlag; //dodgy JSON string of type `MetadataSummary.ts`

  @Attribute(DataTypes.INTEGER)
  declare rating: number; // 0-5

  @Attribute(DataTypes.FLOAT)
  declare imageRatio: number; // width / height (used for sizing on screen elements before image is loaded

  @Attribute(DataTypes.FLOAT)
  declare duration: number; // seconds (video files)

  @Attribute(DataTypes.BIGINT)
  declare fileSize: number;

  @Attribute(DataTypes.DATE)
  declare fileLastModified: Date;

  @Attribute(DataTypes.BOOLEAN)
  declare exists: boolean; // bulk set as 'false' at boot, then set true when detected, to weed out files deleted while server down

  @Attribute(DataTypes.INTEGER)
  declare totalComments: number; //we could calculate it but this is faster and easier

  @Attribute(DataTypes.DATE)
  declare latestComment: Date;

  @ForeignKey(() => Folder)
  @Attribute(DataTypes.INTEGER)
  folderId: number;

  fullPath() {
    return fullPath(this.relativePath) + sep + this.name;
  }

  //Gives path relative to another path, useful to remove 'ZIP root folder' when zipping
  fullPathMinus(path: string) {
    return this.relativePath.replace(path, '') + sep + this.name;
  }
}
