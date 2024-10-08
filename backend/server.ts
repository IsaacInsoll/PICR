import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { config } from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import pg from 'pg';
import { setupRootFolder } from './filesystem/events/addFolder';
import { envPassword } from './boot/envPassword';
import { getVersion } from './boot/getVersion';
import { envSecret } from './boot/envSecret';
import { expressServer } from './express/express';
import { dbMigrate } from './boot/dbMigrate';
import { addDevLogger } from './logger';

config(); // read .ENV

export const picrConfig = {
  tokenSecret: process.env.TOKEN_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  debugSql: process.env.DEBUG_SQL == 'true',
  consoleLogging: process.env.CONSOLE_LOGGING == 'true',
  usePolling: process.env.USE_POLLING == 'true',
  pollingInterval: parseInt(process.env.POLLING_INTERVAL) ?? 20,
  dev: process.env.NODE_ENV === 'development',
  version: 'dev', //overwritten elsewhere
  updateMetadata: false, //re-read metadata, set by dbMigrate
};
if (picrConfig.dev) {
  console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
  console.log(picrConfig);
}

if (picrConfig.consoleLogging) {
  addDevLogger();
}

const server = async () => {
  getVersion();
  const sequelize = new Sequelize(picrConfig.databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: picrConfig.debugSql,
    models: [__dirname + '/models'],
    pool: { max: 50 }, //default max is 5, postgres default limit is 100
  });

  await envSecret();
  try {
    await sequelize.sync({ alter: true }); // build DB
    await dbMigrate(sequelize);
  } catch (e) {
    console.error(
      `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\`. 
   Please ensure configuration is correct and database server is running`,
    );
    console.log(e);
    process.exit();
  }
  await envPassword();
  await setupRootFolder();
  const appName = pkg.name;
  const express = expressServer();

  //Close all the stuff
  process.on('exit', function () {
    sequelize.close().then(() => {
      console.log(`💀 ${appName} Closed`);
    });
  });

  // This is CTRL+C While it's running, trigger a nice shutdown
  process.on('SIGINT', function () {
    console.log(`❌ Shutting down ${appName}`);
    process.exit(0);
  });

  await fileWatcher();
};

server();
