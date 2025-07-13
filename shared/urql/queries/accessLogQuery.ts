import {gql} from "../gql.js";

export const accessLogQuery = gql(/* GraphQL */ `
    query AccessLogsQuery(
        $folderId: ID!
        $userId: ID
        $includeChildren: Boolean
        $userType: UserType
    ) {
        accessLogs(
            folderId: $folderId
            userId: $userId
            includeChildren: $includeChildren
            userType: $userType
        ) {
            id
            timestamp
            type
            userId
            folderId
            ipAddress
            userAgent
            folder {
                ...FolderFragment
            }
        }
    }
`);