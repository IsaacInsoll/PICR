import {
  Column,
  CreatedAt,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table
export class Folder extends Model {
  declare id: number;
  @CreatedAt
  creationDate: Date;

  @UpdatedAt
  updatedOn: Date;

  @Column
  declare name: string;
  @Column
  declare folderHash: string;
  @Column
  declare fullPath: string;

  @Column
  declare parentId: number | null;

  // @HasMany(() => Folder)
  children: Folder[];
}
