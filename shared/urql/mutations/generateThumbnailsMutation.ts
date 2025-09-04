import { gql } from '../gql';

export const generateThumbnailsMutation = gql(/*GraphQL*/ `
    mutation generateThumbnailsQuery($folderId: ID!) {
        generateThumbnails(folderId: $folderId)
    }`);
