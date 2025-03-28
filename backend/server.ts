import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { Sequelize } from 'sequelize-typescript';
import pg from 'pg';
import { setupRootFolder } from './filesystem/events/addFolder';
import { envPassword } from './boot/envPassword';
import { expressServer } from './express/express';
import { dbMigrate } from './boot/dbMigrate';
import { log } from './logger';
import { picrConfig } from './config/picrConfig';
import { initDb } from './db/picrDb';
import { dbTest } from './db/dbTest';

//TODO: //picrConfig.debugSql prop
//TODO: sequelise had "pool=50" (default of 5), can't remember why, see ea9feae4

export const server = async () => {
  initDb();

  const sequelize = new Sequelize(picrConfig.databaseUrl, {
    dialect: 'postgres',
    dialectModule: pg,
    logging: picrConfig.debugSql,
    models: [__dirname + '/db/sequelize'],
    pool: { max: 50 }, //default max is 5, postgres default limit is 100
  });

  try {
    await sequelize.sync(); // build DB: { alter: true }
    await dbMigrate(picrConfig, sequelize);
  } catch (e) {
    console.error(
      `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\`. 
   Please ensure configuration is correct and database server is running`,
    );
    console.log(e);
    process.exit();
  }

  if (picrConfig.dev) await dbTest();

  await envPassword();
  await setupRootFolder();
  const appName = pkg.name;
  const express = expressServer();
  express.listen(picrConfig.port, () => {
    log(
      'info',
      `🌐 App listening at http://localhost:${picrConfig.port}`,
      true,
    );
  });

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

  await fileWatcher(picrConfig);
};
