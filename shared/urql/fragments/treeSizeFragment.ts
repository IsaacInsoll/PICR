import {gql} from "../gql.js";

const treeSizeFragment = gql(/* GraphQL */ `
    fragment TreeSizeFragment on Folder {
        id
        name
        totalFiles
        totalFolders
        totalSize
        totalDirectSize
    }
`);