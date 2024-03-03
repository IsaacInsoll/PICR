import { gql } from '../helpers/gql';

export const viewFolderQuery = gql(/*GraphQL*/ `
    query ViewFolder($folderId: ID!) {
        folder(id:$folderId) {
            id
            name
            parentId
            permissions
            files {
                ...FileFragment
                metadata {
                    ...MetadataFragment
                }
            }
            subFolders {
                id
                name
            }
        }
    }
`);

export const viewMinimumFolderQuery = gql(/*GraphQL*/ `
    query ViewMinimumFolder($folderId: ID!) {
        folder(id:$folderId) {
            id
            name
            parentId
        }
    }
`);

export const metadataFragment = gql(/* GraphQL */ `
  fragment MetadataFragment on MetadataSummary {
    Camera
    Lens
    Artist
    DateTimeOriginal
    DateTimeEdit
    Aperture
    ExposureTime
    ISO
  }
`);
export const fileFragment = gql(/* GraphQL */ `
  fragment FileFragment on File {
    id
    name
    imageRatio
    fileHash
  }
`);

export const viewFileQuery = gql(/*GraphQL*/ `
    query ViewFile($fileId: ID!) {
        file(id:$fileId) {
                ...FileFragment
                metadata {
                    ...MetadataFragment
                }
        }
    }
`);
