import { createHandler } from 'graphql-http/lib/use/express';
import { Folder } from '../models/folder';
import { File } from '../models/file';
import { authenticateToken } from '../auth/auth';
import { schema } from './schema';
import { authMutation } from './authMutation';
import { IncomingHttpHeaders } from 'node:http2';

export const gqlserver = createHandler({
  schema: schema,
  context: async (req, params) => {
    // console.log(params.operationName); //name of query or mutation
    const headers = req.headers as IncomingCustomHeaders;
    const auth = headers.authorization ?? '';
    // respond with 401 if the user was not authenticated
    // if (!userId) {
    //   return [null, { status: 401, statusText: 'Unauthorized' }];
    // }
    return { auth: auth };
  },
  rootValue: {
    folder: async (params, context) => {
      authenticateToken(context);
      const data = await getFolder(params.id);
      data.subFolders = await subFolders(params.id);
      data.files = await subFiles(params.id);
      return data;
    },
    folders: async (params) => {
      return subFolders(params.parentId ?? 1);
    },
    auth: authMutation,
  },
});

const getFolder = async (id: string) => {
  const folder = await Folder.findOne({ where: { id: id } });
  return folder.toJSON();
};

const subFolders = async (parentId: string) => {
  const folders = await Folder.findAll({ where: { parentId } });
  return folders.map((f) => f.toJSON());
};

const subFiles = async (folderId: string) => {
  const files = await File.findAll({ where: { folderId } });
  return files.map((f) => f.toJSON());
};

type IncomingCustomHeaders = IncomingHttpHeaders & { authorization?: string };
