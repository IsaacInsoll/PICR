import {gql} from "../gql.js";

export const generateThumbnailsQuery = gql(/*GraphQL*/ `
    mutation generateThumbnailsQuery($folderId: ID!) {
        generateThumbnails(folderId: $folderId)
    }`);
