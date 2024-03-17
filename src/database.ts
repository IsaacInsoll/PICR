import { config } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import pg from 'pg';

config(); // read .ENV

const storage = process.env.DATABASE_URL;
console.log('using Postgres: ' + storage);
export const sequelize = new Sequelize(storage, {
  dialect: 'postgres',
  dialectModule: pg,
  // dialect: 'sqlite',
  // storage: process.cwd() + '/data/db.sqlite',
  logging: process.env.DEBUG_SQL == 'true',
  // transactionType: Transaction.TYPES.IMMEDIATE,
  // models: [Folder, File, User],
  models: [__dirname + '/models'],
});
