import {gql} from "../gql";

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