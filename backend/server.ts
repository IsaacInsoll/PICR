import express from 'express';
import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { config } from 'dotenv';
import { gqlserver } from './graphql/gqlserver';
import { logger } from './logger';
import path from 'path';
import { Sequelize } from 'sequelize-typescript';
import pg from 'pg';
import { setupRootFolder } from './filesystem/events/addFolder';
import { envPassword } from './boot/envPassword';
import { getVersion } from './boot/getVersion';
import { envSecret } from './boot/envSecret';
import { imageRequest } from './routes/imageRequest';
import { zipRequest } from './routes/zipRequest';
import { expressServer } from './express/express';

config(); // read .ENV

export const picrConfig = {
  tokenSecret: process.env.TOKEN_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  debugSql: process.env.DEBUG_SQL == 'true',
  verbose: process.env.VERBOSE == 'true',
  usePolling: process.env.USE_POLLING == 'true',
  pollingInterval: parseInt(process.env.POLLING_INTERVAL) ?? 20,
  dev: process.env.NODE_ENV === 'development',
  version: 'dev', //overwritten elsewhere
};
if (picrConfig.dev) {
  console.log('SERVER CONFIGURATION ONLY DISPLAYED IN DEV MODE');
  console.log(picrConfig);
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
    await sequelize.sync({}); // build DB
  } catch (e) {
    console.error(
      `⚠️ Unable to connect to database \`${picrConfig.databaseUrl}\`. 
   Please ensure configuration is correct and database server is running`,
    );
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
