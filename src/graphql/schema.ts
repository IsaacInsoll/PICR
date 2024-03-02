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

`);

//  Camera?: string;
//   Lens?: string;
//   Artist?: string;
//   DateTimeEdit?: Date;
//   DateTimeOriginal?: Date;
//   Aperture?: number;
//   // ShutterSpeed?: string;
//   ISO?: number;
//   ExposureTime: number; // n
