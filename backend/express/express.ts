import express from 'express';
import { gqlServer } from '../graphql/gqlServer';
import path from 'path';
import { log } from '../logger';
import { imageRequest } from './imageRequest';
import { zipRequest } from './zipRequest';

export const expressServer = () => {
  const exp = express();

  exp.all('/graphql', gqlServer);
  exp.use(express.static('public'));
  exp.get('/image/:id/:size/:hash/:filename', imageRequest); //filename is ignored but nice for users to see a 'nice' name
  exp.get('/zip/:folderId/:hash/:filename', zipRequest); //filename is ignored but nice for users to see a 'nice' name

  //catch all other URLS and return the front end template
  exp.use((req, res) => {
    res.sendFile(path.join(__dirname, '../../../public/index.html'));
  });

  return exp;
};
