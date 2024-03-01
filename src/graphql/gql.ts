import { createHandler } from 'graphql-http/lib/use/express';
import Folder from '../models/Folder';
import File from '../models/File';
import { schema } from './schema';
import { authMutation } from './authMutation';
import { IncomingCustomHeaders } from '../types/incomingCustomHeaders';
import { contextPermissionsForFolder } from '../auth/contextPermissionsForFolder';
import { RejectIfNoPermissions } from '../auth/doAuthError';

export const gqlserver = createHandler({
  schema: schema,
  context: async (req, params) => {
    const headers = req.headers as IncomingCustomHeaders;
    return { auth: headers.authorization ?? '', uuid: headers.uuid };
  },
  rootValue: {
    folder: async (params, context) => {
      const perms = await contextPermissionsForFolder(context, params.id);
      console.log(perms);
      RejectIfNoPermissions(perms);
      const data = await getFolder(params.id);
      data.subFolders = await subFolders(params.id);
      data.files = await subFiles(params.id);
      return data;
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
