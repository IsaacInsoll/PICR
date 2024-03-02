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
      const permissions = await contextPermissionsForFolder(context, params.id);
      RejectIfNoPermissions(permissions);
      const data = await getFolder(params.id);
      return { ...data, permissions };
    },
    file: async (params, context) => {
      const file = await File.findByPk(params.id);
      const permissions = await contextPermissionsForFolder(
        context,
        file.folderId,
      );
      RejectIfNoPermissions(permissions);
      return fileToJSON(file);
    },
    auth: authMutation,
  },
});

const getFolder = async (id: string) => {
  const folder = await Folder.findByPk(id);
  const data = folder.toJSON();
  data.subFolders = await subFolders(id);
  data.files = await subFiles(id);
  return data;
};

const subFolders = async (parentId: string) => {
  const folders = await Folder.findAll({ where: { parentId } });
  return folders.map((f) => f.toJSON());
};

const subFiles = async (folderId: string) => {
  const files = await File.findAll({ where: { folderId } });
  return files.map((f) => {
    // this was just f.toJSON but all metadata is a single field in the DB currently coz it's 'modular' not 'dodgy'
    return fileToJSON(f);
  });
};

const fileToJSON = (f: File) => {
  return { ...f.toJSON(), metadata: JSON.parse(f.metadata) };
};
