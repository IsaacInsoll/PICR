import express, { Request } from 'express';
import { sequelize } from './database';
import pkg from '../package.json';
import { fileWatcher } from './filesystem/fileWatcher';
import { config } from 'dotenv';
import { gqlserver } from './graphql/resolvers';
import { logger } from './logger';
import { randomBytes } from 'node:crypto';
import path from 'path';
import User from './models/User';
import File from './models/File';
import { hashPassword } from './helpers/hashPassword';
import { fullPathFor } from './helpers/thumbnailGenerator';
import { AllSize, allSizes } from '../frontend/src/helpers/thumbnailSize';

const envPassword = async () => {
  // const password = process.env.ADMIN_PASSWORD;
  const totalUsers = await User.count();
  // if (totalUsers == 0 && !password) {
  //   console.log(
  //     `ERROR: You haven't specified an ADMIN_PASSWORD in .ENV and you don't have any user accounts in the database`,
  //   );
  //   process.exit();
  // }
  if (totalUsers == 0) {
    const admin = User.create({
      username: 'admin',
      hashedPassword: hashPassword('picr1234'),
    });
    console.log(
      '🔐 No users found so "admin" user created with password "password"',
    );
  }
};

const envSecret = async () => {
  if (!process.env.TOKEN_SECRET) {
    const secret = randomBytes(64).toString('hex');
    console.log(`ERROR: You haven't specified a TOKEN_SECRET in .ENV
Heres one we just created for you:
TOKEN_SECRET=${secret}`);
    process.exit();
  }
};

const server = async () => {
  config(); // read .ENV
  await envSecret();
  await sequelize.sync({}); // build DB
  await envPassword();

  const e = express();
  const port = 6900;
  const appName = pkg.name;

  e.all('/graphql', gqlserver);
  e.use(express.static('public'));

  e.get(
    '/image/:id/:size/:hash',
    async (req: Request<{ id: string; size: AllSize; hash: string }>, res) => {
      const { id, size, hash } = req.params;
      const file = await File.findOne({ where: { id, fileHash: hash } });
      if (!file) res.sendStatus(404);
      if (!allSizes.includes(size)) res.sendStatus(400);
      res.sendFile(fullPathFor(file, size));
    },
  );

  e.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });

  e.listen(port, () => {
    logger(`🌐 App listening at http://localhost:${port}`);
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

  fileWatcher();
};

server();
