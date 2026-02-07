import { gql } from '../gql';

export const viewBrandingsQuery = gql(/*GraphQL*/ `
    query ViewBrandingsQuery {
        brandings {
            id
            name
            logoUrl
            primaryColor
            mode
            headingFontKey
            folders {
               ...MinimumFolderFragment
            }
        }
    }
`);
