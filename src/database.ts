import { config } from 'dotenv';
import { DataType, Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Folder } from './models/folder';
import { File } from './models/file';

config(); // read .ENV

// DB FIELDS
const id = {
  type: DataType.INTEGER,
  autoIncrement: true,
  primaryKey: true,
};

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.cwd() + '/data/db.sqlite',
  logging: process.env.DEBUG_SQL == 'true',
  retry: { match: [/SQLITE_BUSY/], name: 'query', max: 5 },
  transactionType: Transaction.TYPES.IMMEDIATE,
  models: [Folder, File],
  // models: [__dirname + '/models']
});

Folder.init(
  {
    id,
    createdAt: DataType.DATE,
    updatedAt: DataType.DATE,
    name: DataType.STRING,
    fullPath: DataType.STRING,
    folderHash: DataType.STRING,
  },
  { sequelize, modelName: 'Folder' },
);

File.init(
  {
    id,
    createdAt: DataType.DATE,
    updatedAt: DataType.DATE,
    name: DataType.STRING,
    fullPath: DataType.STRING,
  },
  { sequelize, modelName: 'File' },
);

Folder.hasMany(File);
File.belongsTo(Folder);

Folder.belongsTo(Folder, {
  foreignKey: 'parentId',
  as: 'parent',
});
Folder.hasMany(Folder, {
  foreignKey: 'parentId',
  as: 'children',
});
