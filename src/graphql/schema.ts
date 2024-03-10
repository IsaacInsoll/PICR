import { buildSchema } from 'graphql/index';

/*
 TODO: swap from buildSchema to

 FROM:
         const schema = buildSchema(`
          type Query {
            hello: String
          }
        `);

const root = { hello: () => 'Hello world!' };

TO:
        const schema = new GraphQLSchema({
          query: new GraphQLObjectType({
            name: 'Query',
            fields: () => ({
              hello: {
                type: GraphQLString,
                resolve: () => 'Hello world!'
              }
            })
          })
        });

 */

//     file: fileResolver,
//     publicLinks: publicLinkResolver,
//     auth: authMutation,

// TODO: couldn't get this to work due to folderType pointing to itself due to parent reference
// const queryType = new GraphQLObjectType({
//   name: 'Query',
//   fields: () => ({
//     folder: { type: 'Folder!', resolve: folderResolver },
//   }),
// });
//
// export const newSchema = new GraphQLSchema({
//   query: queryType,
//   types: [new GraphQLObjectType({ name: 'Folder', fields: [] })],
// });
//
// const folderType = new GraphQLObjectType({
//   name: 'Folder',
//   fields: {
//     id: { type: GraphQLID },
//     name: { type: GraphQLString },
//     parentId: { type: GraphQLID },
//     subFolders: {
//       type: new GraphQLList(folderType),
//       // resolve: resolver(User.Tasks)
//     },
//     files: { type: new GraphQLList(fileType) },
//     permissions: { type: folderPermissions },
//   },
// });

export const schema = buildSchema(/*GraphQL */ `
    type Query {
        folder(id: ID!): Folder!
        file(id: ID!): File!
        users(folderId: ID!, includeParents: Boolean) : [User!]!
        user(id: ID!): User!
    }

    type Mutation {
        auth(user: String!, password: String!) : String!
        editUser(id: ID, folderId: ID, name: String, uuid: String, enabled: Boolean): User!
    }
    
    type Folder {
        id: ID!
        name: String!
        parentId: ID
        parent: Folder
        subFolders: [Folder!]!
        files: [File!]!
        permissions: FolderPermissions
    }

    type File {
        id: ID!
        name: String!
        folderId: ID!
        imageRatio: Float
        fileHash: String!
        metadata: MetadataSummary
    }

    enum FolderPermissions {
        View
        Admin
        None
    }

    type MetadataSummary {
        Camera: String
        Lens: String
        Artist: String
        DateTimeEdit: String
        DateTimeOriginal: String
        Aperture: Float
        #        ShutterSpeed: Float
        ExposureTime: Float
        ISO: Float
    }

    type User {
        id: ID!
        name: String!
        uuid: String!
        enabled: Boolean!
        folderId: ID!
        folder: Folder
    }

`);
