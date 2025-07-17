import {gql} from "../gql.js";

export const minimumFolderFragment = gql(/* GraphQL */ `
  fragment MinimumFolderFragment on Folder {
    id
    __typename
    name
    parentId
    ...HeroImageFragment
  }
`);
