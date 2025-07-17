import {gql} from "../gql.js";

export const deleteBrandingMutation = gql(/* GraphQL */ `
    mutation DeleteBrandingMutation($folderId: ID!) {
        deleteBranding(folderId: $folderId) {
            ...FolderFragment
        }
    }
`);