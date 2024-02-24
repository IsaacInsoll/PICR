import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { Folder } from './models/folder';
import { File } from './models/file';
import { generateAccessToken } from './auth/auth';

const schema = buildSchema(/*GraphQL */ `
    type Query {
        folders(parentId: ID): [Folder!]!
        folder(id: ID!): Folder!
        auth(user: String!, password: String!) : String!
    }

    type Mutation {
        auth(user: String!, password: String!) : String!
    }
    type Folder {
        id: ID!
        name: String!
        parentId: ID
        subFolders: [Folder!]!
        files: [File!]!
    }
    
    type File {
      id: ID!
      name: String!
      folderId: ID!
    }

`);

const root = {
  folder: async (params) => {
    const data = await getFolder(params.id);
    data.subFolders = await subFolders(params.id);
    data.files = await subFiles(params.id);
    return data;
  },
  folders: async (params) => {
    return subFolders(params.parentId ?? 1);
  },
  auth: async (params) => {
    // TODO: actual auth users
    if (params.password != 'password') return '';
    return generateAccessToken({ username: params.username });
  },
};

export const gqlserver = createHandler({
  schema: schema,
  rootValue: root,
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
