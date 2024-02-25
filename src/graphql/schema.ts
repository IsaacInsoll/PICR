import { buildSchema } from 'graphql/index';

export const schema = buildSchema(/*GraphQL */ `
    type Query {
        folders(parentId: ID): [Folder!]!
        folder(id: ID!): Folder!
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
        imageRatio: Float
    }

`);
