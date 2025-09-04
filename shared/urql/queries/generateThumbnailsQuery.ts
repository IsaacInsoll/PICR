import { gql } from '../gql';

export const generateThumbnailsQuery = gql(/* GraphQL*/ `
    query generateThumbnailsStats($folderId: ID!) {
        folder(id: $folderId) {
            ...FolderFragment
            totalImages
        }
    }
`);
