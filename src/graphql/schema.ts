import { buildSchema } from 'graphql/index';

export const schema = buildSchema(/*GraphQL */ `
    type Query {
        folder(id: ID!): Folder!
        file(id: ID!): File!
        publicLinks(folderId: ID!, includeParents: Boolean) : [PublicLink!]!
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
    
    type PublicLink {
        id: ID!
        name: String!
        uuid: String!
        availableFrom: String!
        availableTo: String!
        enabled: Boolean!
        folderId: ID!
        folder: Folder!
    }

`);
