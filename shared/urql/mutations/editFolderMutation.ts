import {gql} from "../gql";

export const editFolderMutation = gql(/* GraphQL */ `
    mutation editFolder($folderId: ID!, $heroImageId: ID!) {
        editFolder(folderId: $folderId, heroImageId: $heroImageId) {
            ...FolderFragment
            ...HeroImageFragment
        }
    }
`);