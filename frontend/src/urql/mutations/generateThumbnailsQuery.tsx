import { gql } from '../../helpers/gql';

export const generateThumbnailsQuery = gql(/*GraphQL*/ `
    mutation generateThumbnailsQuery($folderId: ID!) {
        generateThumbnails(folderId: $folderId)
    }`);
