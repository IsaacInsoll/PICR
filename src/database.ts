import { config } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Folder } from './models/folder';
import { File } from './models/file';

config(); // read .ENV

// DB FIELDS

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.cwd() + '/data/db.sqlite',
  logging: process.env.DEBUG_SQL == 'true',
  retry: { match: [/SQLITE_BUSY/], name: 'query', max: 5 },
  transactionType: Transaction.TYPES.IMMEDIATE,
  models: [Folder, File],
  // models: [__dirname + '/models']
});
