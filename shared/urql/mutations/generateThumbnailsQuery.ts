import {gql} from "../gql";

export const generateThumbnailsQuery = gql(/*GraphQL*/ `
    mutation generateThumbnailsQuery($folderId: ID!) {
        generateThumbnails(folderId: $folderId)
    }`);
