import { config } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';

config(); // read .ENV

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.cwd() + '/data/db.sqlite',
  logging: process.env.DEBUG_SQL == 'true',
  retry: { match: [/SQLITE_BUSY/], name: 'query', max: 5 },
  pool: {
    // maxactive: 1,
    max: 5,
    min: 0,
    idle: 20000,
  },
  transactionType: Transaction.TYPES.IMMEDIATE,
  // models: [Folder, File, User],
  models: [__dirname + '/models'],
});
