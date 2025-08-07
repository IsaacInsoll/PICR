import express, { Request, Response } from 'express';
import { gqlServer } from "../graphql/gqlServer.js";
import { imageRequest } from "./imageRequest.js";
import { zipRequest } from "./zipRequest.js";
import { picrTemplate } from "./picrTemplate.js";

export const expressServer = () => {
  const exp = express();

  exp.all('/graphql', gqlServer);
  exp.use(express.static('public', { index: false }));
  exp.get('/image/:id/:size/:hash/:filename', imageRequest); //filename is ignored but nice for users to see a 'nice' name
  exp.get('/zip/:folderId/:hash/:filename', zipRequest); //filename is ignored but nice for users to see a 'nice' name
  exp.get('/debug',debug);
  //catch all other URLS and return the front end template
  exp.use(picrTemplate);

  return exp;
};

const debug=async (
  req: Request,
  res: Response) =>{
  console.log(req);
  res.sendStatus(404);
};