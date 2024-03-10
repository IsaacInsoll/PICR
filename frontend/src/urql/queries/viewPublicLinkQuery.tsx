import { gql } from '../../helpers/gql';

export const viewPublicLinkQuery = gql(/*GraphQL*/ `
    query ViewPublicLink($id: ID!) {
        publicLink(id:$id) {
            ...PublicLinkFragment
            
        }
    }
`);
