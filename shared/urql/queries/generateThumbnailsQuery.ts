import {gql} from "../gql.js";

const generateThumbnailsQuery = gql(/* GraphQL*/ `
    query generateThumbnailsStats($folderId: ID!) {
        folder(id: $folderId) {
            ...FolderFragment
            totalImages
        }
    }
`)