import { gql } from '../../helpers/gql';

export const viewFileQuery = gql(/*GraphQL*/ `
    query ViewFile($fileId: ID!) {
        file(id:$fileId) {
            ...FileFragment
            metadata {
                ...MetadataFragment
            }
        }
    }
`);
