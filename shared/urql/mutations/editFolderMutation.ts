import {gql} from "../gql.js";

export const editFolderMutation = gql(/* GraphQL */ `
    mutation editFolder($folderId: ID!, $heroImageId: ID!) {
        editFolder(folderId: $folderId, heroImageId: $heroImageId) {
            ...FolderFragment
            ...HeroImageFragment
        }
    }
`);