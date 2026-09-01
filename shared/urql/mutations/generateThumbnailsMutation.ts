import { gql } from '../gql';

export const generateThumbnailsMutation = gql(/*GraphQL*/ `
    mutation generateThumbnailsQuery($folderId: ID!, $mediaType: MediaTypeFilter) {
        generateThumbnails(folderId: $folderId, mediaType: $mediaType)
    }`);
