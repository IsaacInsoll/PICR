import {gql} from "../gql";

const generateThumbnailsQuery = gql(/* GraphQL*/ `
    query generateThumbnailsStats($folderId: ID!) {
        folder(id: $folderId) {
            ...FolderFragment
            totalImages
        }
    }
`)