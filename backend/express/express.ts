import express from 'express';
import { gqlServer } from '../graphql/gqlServer';
import { imageRequest } from './imageRequest';
import { zipRequest } from './zipRequest';
import { picrTemplate } from './picrTemplate';

export const expressServer = () => {
  const exp = express();

  exp.all('/graphql', gqlServer);
  exp.use(express.static('public', { index: false }));
  exp.get('/image/:id/:size/:hash/:filename', imageRequest); //filename is ignored but nice for users to see a 'nice' name
  exp.get('/zip/:folderId/:hash/:filename', zipRequest); //filename is ignored but nice for users to see a 'nice' name

  //catch all other URLS and return the front end template
  exp.use(picrTemplate);

  return exp;
};
