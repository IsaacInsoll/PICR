import { gql } from '../../../frontend/src/helpers/gql';

export const generateThumbnailsQuery = gql(/*GraphQL*/ `
    mutation generateThumbnailsQuery($folderId: ID!) {
        generateThumbnails(folderId: $folderId)
    }`);
