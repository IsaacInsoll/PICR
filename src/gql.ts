import { buildSchema } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/express';
import { Folder } from './models/folder';

const schema = buildSchema(/*GraphQL */ `
    type Query {
        folders(parentId: ID): [Folder!]!
        folder(id: ID!): Folder!
    }
    type Folder {
        id: ID!
        name: String!
        parentId: ID
    }

`);

const root = {
  folder: async (params) => {
    const folder = await Folder.findOne({ where: { id: params.id } });
    return folder.toJSON();
  },
  folders: async (params) => {
    const parentId = params.parentId ?? 1;
    const folders = await Folder.findAll({ where: { parentId } });
    return folders.map((f) => f.toJSON());
  },
};

export const gqlserver = createHandler({
  schema: schema,
  rootValue: root,
});
