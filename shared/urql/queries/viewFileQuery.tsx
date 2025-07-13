import { gql } from '../../../frontend/src/helpers/gql';

export const viewFileQuery = gql(/*GraphQL*/ `
    query ViewFile($fileId: ID!) {
        file(id:$fileId) {
            ...FileFragment
            ...ImageMetadataFragment
        }
    }
`);
