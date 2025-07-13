import {gql} from "../gql.js";

export const viewFileQuery = gql(/*GraphQL*/ `
    query ViewFile($fileId: ID!) {
        file(id:$fileId) {
            ...FileFragment
            ...ImageMetadataFragment
        }
    }
`);
