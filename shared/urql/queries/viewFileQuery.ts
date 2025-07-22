import {gql} from "../gql";

export const viewFileQuery = gql(/*GraphQL*/ `
    query ViewFile($fileId: ID!) {
        file(id:$fileId) {
            ...FileFragment
            ...ImageMetadataFragment
        }
    }
`);
