/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    fileCreated\n    fileLastModified\n    flag\n    rating\n    totalComments\n    latestComment\n    folderId\n    ... on Video {\n      imageRatio\n      duration\n      ...VideoMetadataFragment\n    }\n    ... on Image {\n      imageRatio\n      blurHash\n      ...ImageMetadataFragment\n    }\n  }\n": typeof types.FileFragmentFragmentDoc,
    "\n  fragment FolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    permissions\n    folderLastModified\n    parents {\n      id\n      name\n    }\n    branding {\n      id\n      folderId\n      mode\n      primaryColor\n      logoUrl\n      folder {\n        id\n        name\n      }\n    }\n    ...HeroImageFragment\n  }\n": typeof types.FolderFragmentFragmentDoc,
    "\n  fragment HeroImageFragment on Folder {\n    heroImage {\n      id\n      name\n      fileHash\n      imageRatio\n      blurHash\n      type\n    }\n  }\n": typeof types.HeroImageFragmentFragmentDoc,
    "\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n        Width\n        Height\n        Rating\n      }\n    }\n  }\n": typeof types.ImageMetadataFragmentFragmentDoc,
    "\n  fragment MinimumFolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    folderLastModified\n    ...HeroImageFragment\n  }\n": typeof types.MinimumFolderFragmentFragmentDoc,
    "\n  fragment TreeSizeFragment on Folder {\n    id\n    name\n    totalFiles\n    totalFolders\n    totalSize\n    totalDirectSize\n  }\n": typeof types.TreeSizeFragmentFragmentDoc,
    "\n  query TreeSizeQuery($folderId: ID!) {\n    folder(id: $folderId) {\n      parents {\n        id\n        name\n      }\n      ...TreeSizeFragment\n      files {\n        id\n        name\n        type\n        fileSize\n      }\n      subFolders {\n        ...TreeSizeFragment\n        subFolders {\n          ...TreeSizeFragment\n        }\n      }\n    }\n  }\n": typeof types.TreeSizeQueryDocument,
    "\n  fragment UserFragment on User {\n    id\n    name\n    username\n    enabled\n    uuid\n    folderId\n    commentPermissions\n    gravatar\n    ntfy\n    ntfyEmail\n    folder {\n      id\n      name\n      parents {\n        id\n        name\n      }\n    }\n  }\n": typeof types.UserFragmentFragmentDoc,
    "\n  fragment VideoMetadataFragment on Video {\n    ... on Video {\n      metadata {\n        Bitrate\n        Duration\n        Format\n        VideoCodec\n        VideoCodecDescription\n        Width\n        Height\n        Framerate\n        AudioCodec\n        AudioCodecDescription\n      }\n    }\n  }\n": typeof types.VideoMetadataFragmentFragmentDoc,
    "\n  mutation addComment(\n    $id: ID!\n    $rating: Int\n    $flag: FileFlag\n    $comment: String\n    $nickName: String\n  ) {\n    addComment(\n      id: $id\n      rating: $rating\n      flag: $flag\n      comment: $comment\n      nickName: $nickName\n    ) {\n      ...FileFragment\n    }\n  }\n": typeof types.AddCommentDocument,
    "\n  mutation DeleteBrandingMutation($folderId: ID!) {\n    deleteBranding(folderId: $folderId) {\n      ...FolderFragment\n    }\n  }\n": typeof types.DeleteBrandingMutationDocument,
    "\n  mutation EditAdminUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $password: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n    $ntfy: String\n    $ntfyEmail: Boolean\n  ) {\n    editAdminUser(\n      id: $id\n      name: $name\n      username: $username\n      password: $password\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n      ntfy: $ntfy\n      ntfyEmail: $ntfyEmail\n    ) {\n      ...UserFragment\n    }\n  }\n": typeof types.EditAdminUserMutationDocument,
    "\n  mutation EditBrandingMutation(\n    $folderId: ID!\n    $mode: ThemeMode\n    $primaryColor: PrimaryColor\n    $logoUrl: String\n  ) {\n    editBranding(\n      folderId: $folderId\n      mode: $mode\n      primaryColor: $primaryColor\n      logoUrl: $logoUrl\n    ) {\n      ...FolderFragment\n    }\n  }\n": typeof types.EditBrandingMutationDocument,
    "\n  mutation editFolder($folderId: ID!, $heroImageId: ID!) {\n    editFolder(folderId: $folderId, heroImageId: $heroImageId) {\n      ...FolderFragment\n      ...HeroImageFragment\n    }\n  }\n": typeof types.EditFolderDocument,
    "\n  mutation EditUserDeviceMutation(\n    $token: String!\n    $name: String!\n    $userId: ID!\n    $enabled: Boolean!\n  ) {\n    editUserDevice(\n      notificationToken: $token\n      userId: $userId\n      enabled: $enabled\n      name: $name\n    ) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n": typeof types.EditUserDeviceMutationDocument,
    "\n  mutation EditUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      username: $username\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n    ) {\n      ...UserFragment\n    }\n  }\n": typeof types.EditUserMutationDocument,
    "\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }": typeof types.GenerateThumbnailsQueryDocument,
    "\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n": typeof types.GenerateZipDocument,
    "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n": typeof types.LoginDocument,
    "\n  mutation RenameFolder(\n    $folderId: ID!\n    $oldPath: String!\n    $newPath: String!\n  ) {\n    renameFolder(folderId: $folderId, oldPath: $oldPath, newPath: $newPath) {\n      ...FolderFragment\n    }\n  }\n": typeof types.RenameFolderDocument,
    "\n  query AccessLogsQuery(\n    $folderId: ID!\n    $userId: ID\n    $includeChildren: Boolean\n    $userType: UserType\n  ) {\n    accessLogs(\n      folderId: $folderId\n      userId: $userId\n      includeChildren: $includeChildren\n      userType: $userType\n    ) {\n      id\n      timestamp\n      type\n      userId\n      folderId\n      ipAddress\n      userAgent\n      folder {\n        ...FolderFragment\n      }\n    }\n  }\n": typeof types.AccessLogsQueryDocument,
    "\n  query commentHistoryQuery($fileId: ID, $folderId: ID) {\n    comments(fileId: $fileId, folderId: $folderId) {\n      id\n      comment\n      systemGenerated\n      timestamp\n      userId\n      file {\n        ...FileFragment\n      }\n      user {\n        id\n        gravatar\n        name\n      }\n    }\n  }\n": typeof types.CommentHistoryQueryDocument,
    "\n    query generateThumbnailsStats($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalImages\n        }\n    }\n": typeof types.GenerateThumbnailsStatsDocument,
    "\n    query ManageFolderQuery($folderId: ID!, $includeParents: Boolean!, $includeChildren: Boolean!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n        }\n        users(folderId:$folderId, includeParents: $includeParents, includeChildren: $includeChildren) {\n           ...UserFragment\n           folderId\n            folder {\n                ...FolderFragment\n            }\n        }\n    }\n": typeof types.ManageFolderQueryDocument,
    "\n  query MeQuery {\n    me {\n      id\n      userType\n      name\n      folderId\n      uuid\n      commentPermissions\n      folder {\n        id\n        name\n      }\n    }\n    clientInfo {\n      baseUrl\n      avifEnabled\n      canWrite\n    }\n  }\n": typeof types.MeQueryDocument,
    "\n  query readAllFoldersQuery($id: ID!, $sort: FoldersSortType, $limit: Int) {\n    allFolders(id: $id, sort: $sort, limit: $limit) {\n      ...FolderFragment\n    }\n  }\n": typeof types.ReadAllFoldersQueryDocument,
    "\n  query RecentUsersQuery($folderId: ID!) {\n    users(folderId: $folderId, sortByRecent: true, includeChildren: true) {\n      id\n      name\n      folderId\n      lastAccess\n      gravatar\n      folder {\n        id\n        name\n        parents {\n          id\n          name\n        }\n        ...HeroImageFragment\n      }\n    }\n  }\n": typeof types.RecentUsersQueryDocument,
    "\n  query searchQuery($folderId: ID!, $query: String!) {\n    searchFolders(folderId: $folderId, query: $query) {\n      ...FolderFragment\n    }\n    searchFiles(folderId: $folderId, query: $query) {\n      ...FileFragment\n      folder {\n        ...MinimumFolderFragment\n      }\n    }\n  }\n": typeof types.SearchQueryDocument,
    "\n  query serverInfoQuery {\n    serverInfo {\n      version\n      latest\n      databaseUrl\n      dev\n      usePolling\n      host\n      canWrite\n    }\n  }\n": typeof types.ServerInfoQueryDocument,
    "\n  query expensiveServerFileSizeQuery {\n    serverInfo {\n      cacheSize\n      mediaSize\n    }\n  }\n": typeof types.ExpensiveServerFileSizeQueryDocument,
    "\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n": typeof types.TaskQueryDocument,
    "\n  query UserDeviceQuery($userId: ID!, $token: String!) {\n    userDevices(userId: $userId, notificationToken: $token) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n": typeof types.UserDeviceQueryDocument,
    "\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n": typeof types.ViewAdminsQueryDocument,
    "\n    query ViewBrandingsQuery {\n        brandings {\n            id\n            logoUrl\n            primaryColor\n            mode\n            folderId\n            folder {\n               ...MinimumFolderFragment\n            }\n        }\n    }\n": typeof types.ViewBrandingsQueryDocument,
    "\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n": typeof types.ViewFileDocument,
    "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n                users {\n                    id\n                    name\n                    enabled\n                    commentPermissions\n                    gravatar\n                }\n            }\n        }\n    }\n": typeof types.ViewFolderDocument,
    "\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n": typeof types.ViewUserQueryDocument,
};
const documents: Documents = {
    "\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    fileCreated\n    fileLastModified\n    flag\n    rating\n    totalComments\n    latestComment\n    folderId\n    ... on Video {\n      imageRatio\n      duration\n      ...VideoMetadataFragment\n    }\n    ... on Image {\n      imageRatio\n      blurHash\n      ...ImageMetadataFragment\n    }\n  }\n": types.FileFragmentFragmentDoc,
    "\n  fragment FolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    permissions\n    folderLastModified\n    parents {\n      id\n      name\n    }\n    branding {\n      id\n      folderId\n      mode\n      primaryColor\n      logoUrl\n      folder {\n        id\n        name\n      }\n    }\n    ...HeroImageFragment\n  }\n": types.FolderFragmentFragmentDoc,
    "\n  fragment HeroImageFragment on Folder {\n    heroImage {\n      id\n      name\n      fileHash\n      imageRatio\n      blurHash\n      type\n    }\n  }\n": types.HeroImageFragmentFragmentDoc,
    "\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n        Width\n        Height\n        Rating\n      }\n    }\n  }\n": types.ImageMetadataFragmentFragmentDoc,
    "\n  fragment MinimumFolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    folderLastModified\n    ...HeroImageFragment\n  }\n": types.MinimumFolderFragmentFragmentDoc,
    "\n  fragment TreeSizeFragment on Folder {\n    id\n    name\n    totalFiles\n    totalFolders\n    totalSize\n    totalDirectSize\n  }\n": types.TreeSizeFragmentFragmentDoc,
    "\n  query TreeSizeQuery($folderId: ID!) {\n    folder(id: $folderId) {\n      parents {\n        id\n        name\n      }\n      ...TreeSizeFragment\n      files {\n        id\n        name\n        type\n        fileSize\n      }\n      subFolders {\n        ...TreeSizeFragment\n        subFolders {\n          ...TreeSizeFragment\n        }\n      }\n    }\n  }\n": types.TreeSizeQueryDocument,
    "\n  fragment UserFragment on User {\n    id\n    name\n    username\n    enabled\n    uuid\n    folderId\n    commentPermissions\n    gravatar\n    ntfy\n    ntfyEmail\n    folder {\n      id\n      name\n      parents {\n        id\n        name\n      }\n    }\n  }\n": types.UserFragmentFragmentDoc,
    "\n  fragment VideoMetadataFragment on Video {\n    ... on Video {\n      metadata {\n        Bitrate\n        Duration\n        Format\n        VideoCodec\n        VideoCodecDescription\n        Width\n        Height\n        Framerate\n        AudioCodec\n        AudioCodecDescription\n      }\n    }\n  }\n": types.VideoMetadataFragmentFragmentDoc,
    "\n  mutation addComment(\n    $id: ID!\n    $rating: Int\n    $flag: FileFlag\n    $comment: String\n    $nickName: String\n  ) {\n    addComment(\n      id: $id\n      rating: $rating\n      flag: $flag\n      comment: $comment\n      nickName: $nickName\n    ) {\n      ...FileFragment\n    }\n  }\n": types.AddCommentDocument,
    "\n  mutation DeleteBrandingMutation($folderId: ID!) {\n    deleteBranding(folderId: $folderId) {\n      ...FolderFragment\n    }\n  }\n": types.DeleteBrandingMutationDocument,
    "\n  mutation EditAdminUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $password: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n    $ntfy: String\n    $ntfyEmail: Boolean\n  ) {\n    editAdminUser(\n      id: $id\n      name: $name\n      username: $username\n      password: $password\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n      ntfy: $ntfy\n      ntfyEmail: $ntfyEmail\n    ) {\n      ...UserFragment\n    }\n  }\n": types.EditAdminUserMutationDocument,
    "\n  mutation EditBrandingMutation(\n    $folderId: ID!\n    $mode: ThemeMode\n    $primaryColor: PrimaryColor\n    $logoUrl: String\n  ) {\n    editBranding(\n      folderId: $folderId\n      mode: $mode\n      primaryColor: $primaryColor\n      logoUrl: $logoUrl\n    ) {\n      ...FolderFragment\n    }\n  }\n": types.EditBrandingMutationDocument,
    "\n  mutation editFolder($folderId: ID!, $heroImageId: ID!) {\n    editFolder(folderId: $folderId, heroImageId: $heroImageId) {\n      ...FolderFragment\n      ...HeroImageFragment\n    }\n  }\n": types.EditFolderDocument,
    "\n  mutation EditUserDeviceMutation(\n    $token: String!\n    $name: String!\n    $userId: ID!\n    $enabled: Boolean!\n  ) {\n    editUserDevice(\n      notificationToken: $token\n      userId: $userId\n      enabled: $enabled\n      name: $name\n    ) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n": types.EditUserDeviceMutationDocument,
    "\n  mutation EditUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      username: $username\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n    ) {\n      ...UserFragment\n    }\n  }\n": types.EditUserMutationDocument,
    "\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }": types.GenerateThumbnailsQueryDocument,
    "\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n": types.GenerateZipDocument,
    "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n": types.LoginDocument,
    "\n  mutation RenameFolder(\n    $folderId: ID!\n    $oldPath: String!\n    $newPath: String!\n  ) {\n    renameFolder(folderId: $folderId, oldPath: $oldPath, newPath: $newPath) {\n      ...FolderFragment\n    }\n  }\n": types.RenameFolderDocument,
    "\n  query AccessLogsQuery(\n    $folderId: ID!\n    $userId: ID\n    $includeChildren: Boolean\n    $userType: UserType\n  ) {\n    accessLogs(\n      folderId: $folderId\n      userId: $userId\n      includeChildren: $includeChildren\n      userType: $userType\n    ) {\n      id\n      timestamp\n      type\n      userId\n      folderId\n      ipAddress\n      userAgent\n      folder {\n        ...FolderFragment\n      }\n    }\n  }\n": types.AccessLogsQueryDocument,
    "\n  query commentHistoryQuery($fileId: ID, $folderId: ID) {\n    comments(fileId: $fileId, folderId: $folderId) {\n      id\n      comment\n      systemGenerated\n      timestamp\n      userId\n      file {\n        ...FileFragment\n      }\n      user {\n        id\n        gravatar\n        name\n      }\n    }\n  }\n": types.CommentHistoryQueryDocument,
    "\n    query generateThumbnailsStats($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalImages\n        }\n    }\n": types.GenerateThumbnailsStatsDocument,
    "\n    query ManageFolderQuery($folderId: ID!, $includeParents: Boolean!, $includeChildren: Boolean!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n        }\n        users(folderId:$folderId, includeParents: $includeParents, includeChildren: $includeChildren) {\n           ...UserFragment\n           folderId\n            folder {\n                ...FolderFragment\n            }\n        }\n    }\n": types.ManageFolderQueryDocument,
    "\n  query MeQuery {\n    me {\n      id\n      userType\n      name\n      folderId\n      uuid\n      commentPermissions\n      folder {\n        id\n        name\n      }\n    }\n    clientInfo {\n      baseUrl\n      avifEnabled\n      canWrite\n    }\n  }\n": types.MeQueryDocument,
    "\n  query readAllFoldersQuery($id: ID!, $sort: FoldersSortType, $limit: Int) {\n    allFolders(id: $id, sort: $sort, limit: $limit) {\n      ...FolderFragment\n    }\n  }\n": types.ReadAllFoldersQueryDocument,
    "\n  query RecentUsersQuery($folderId: ID!) {\n    users(folderId: $folderId, sortByRecent: true, includeChildren: true) {\n      id\n      name\n      folderId\n      lastAccess\n      gravatar\n      folder {\n        id\n        name\n        parents {\n          id\n          name\n        }\n        ...HeroImageFragment\n      }\n    }\n  }\n": types.RecentUsersQueryDocument,
    "\n  query searchQuery($folderId: ID!, $query: String!) {\n    searchFolders(folderId: $folderId, query: $query) {\n      ...FolderFragment\n    }\n    searchFiles(folderId: $folderId, query: $query) {\n      ...FileFragment\n      folder {\n        ...MinimumFolderFragment\n      }\n    }\n  }\n": types.SearchQueryDocument,
    "\n  query serverInfoQuery {\n    serverInfo {\n      version\n      latest\n      databaseUrl\n      dev\n      usePolling\n      host\n      canWrite\n    }\n  }\n": types.ServerInfoQueryDocument,
    "\n  query expensiveServerFileSizeQuery {\n    serverInfo {\n      cacheSize\n      mediaSize\n    }\n  }\n": types.ExpensiveServerFileSizeQueryDocument,
    "\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n": types.TaskQueryDocument,
    "\n  query UserDeviceQuery($userId: ID!, $token: String!) {\n    userDevices(userId: $userId, notificationToken: $token) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n": types.UserDeviceQueryDocument,
    "\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n": types.ViewAdminsQueryDocument,
    "\n    query ViewBrandingsQuery {\n        brandings {\n            id\n            logoUrl\n            primaryColor\n            mode\n            folderId\n            folder {\n               ...MinimumFolderFragment\n            }\n        }\n    }\n": types.ViewBrandingsQueryDocument,
    "\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n": types.ViewFileDocument,
    "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n                users {\n                    id\n                    name\n                    enabled\n                    commentPermissions\n                    gravatar\n                }\n            }\n        }\n    }\n": types.ViewFolderDocument,
    "\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n": types.ViewUserQueryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    fileCreated\n    fileLastModified\n    flag\n    rating\n    totalComments\n    latestComment\n    folderId\n    ... on Video {\n      imageRatio\n      duration\n      ...VideoMetadataFragment\n    }\n    ... on Image {\n      imageRatio\n      blurHash\n      ...ImageMetadataFragment\n    }\n  }\n"): (typeof documents)["\n  fragment FileFragment on FileInterface {\n    __typename\n    id\n    name\n    type\n    fileHash\n    fileSize\n    fileCreated\n    fileLastModified\n    flag\n    rating\n    totalComments\n    latestComment\n    folderId\n    ... on Video {\n      imageRatio\n      duration\n      ...VideoMetadataFragment\n    }\n    ... on Image {\n      imageRatio\n      blurHash\n      ...ImageMetadataFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment FolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    permissions\n    folderLastModified\n    parents {\n      id\n      name\n    }\n    branding {\n      id\n      folderId\n      mode\n      primaryColor\n      logoUrl\n      folder {\n        id\n        name\n      }\n    }\n    ...HeroImageFragment\n  }\n"): (typeof documents)["\n  fragment FolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    permissions\n    folderLastModified\n    parents {\n      id\n      name\n    }\n    branding {\n      id\n      folderId\n      mode\n      primaryColor\n      logoUrl\n      folder {\n        id\n        name\n      }\n    }\n    ...HeroImageFragment\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment HeroImageFragment on Folder {\n    heroImage {\n      id\n      name\n      fileHash\n      imageRatio\n      blurHash\n      type\n    }\n  }\n"): (typeof documents)["\n  fragment HeroImageFragment on Folder {\n    heroImage {\n      id\n      name\n      fileHash\n      imageRatio\n      blurHash\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n        Width\n        Height\n        Rating\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment ImageMetadataFragment on Image {\n    ... on Image {\n      metadata {\n        Camera\n        Lens\n        Artist\n        DateTimeOriginal\n        DateTimeEdit\n        Aperture\n        ExposureTime\n        ISO\n        Width\n        Height\n        Rating\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment MinimumFolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    folderLastModified\n    ...HeroImageFragment\n  }\n"): (typeof documents)["\n  fragment MinimumFolderFragment on Folder {\n    id\n    __typename\n    name\n    parentId\n    folderLastModified\n    ...HeroImageFragment\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment TreeSizeFragment on Folder {\n    id\n    name\n    totalFiles\n    totalFolders\n    totalSize\n    totalDirectSize\n  }\n"): (typeof documents)["\n  fragment TreeSizeFragment on Folder {\n    id\n    name\n    totalFiles\n    totalFolders\n    totalSize\n    totalDirectSize\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TreeSizeQuery($folderId: ID!) {\n    folder(id: $folderId) {\n      parents {\n        id\n        name\n      }\n      ...TreeSizeFragment\n      files {\n        id\n        name\n        type\n        fileSize\n      }\n      subFolders {\n        ...TreeSizeFragment\n        subFolders {\n          ...TreeSizeFragment\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query TreeSizeQuery($folderId: ID!) {\n    folder(id: $folderId) {\n      parents {\n        id\n        name\n      }\n      ...TreeSizeFragment\n      files {\n        id\n        name\n        type\n        fileSize\n      }\n      subFolders {\n        ...TreeSizeFragment\n        subFolders {\n          ...TreeSizeFragment\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserFragment on User {\n    id\n    name\n    username\n    enabled\n    uuid\n    folderId\n    commentPermissions\n    gravatar\n    ntfy\n    ntfyEmail\n    folder {\n      id\n      name\n      parents {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment UserFragment on User {\n    id\n    name\n    username\n    enabled\n    uuid\n    folderId\n    commentPermissions\n    gravatar\n    ntfy\n    ntfyEmail\n    folder {\n      id\n      name\n      parents {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment VideoMetadataFragment on Video {\n    ... on Video {\n      metadata {\n        Bitrate\n        Duration\n        Format\n        VideoCodec\n        VideoCodecDescription\n        Width\n        Height\n        Framerate\n        AudioCodec\n        AudioCodecDescription\n      }\n    }\n  }\n"): (typeof documents)["\n  fragment VideoMetadataFragment on Video {\n    ... on Video {\n      metadata {\n        Bitrate\n        Duration\n        Format\n        VideoCodec\n        VideoCodecDescription\n        Width\n        Height\n        Framerate\n        AudioCodec\n        AudioCodecDescription\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation addComment(\n    $id: ID!\n    $rating: Int\n    $flag: FileFlag\n    $comment: String\n    $nickName: String\n  ) {\n    addComment(\n      id: $id\n      rating: $rating\n      flag: $flag\n      comment: $comment\n      nickName: $nickName\n    ) {\n      ...FileFragment\n    }\n  }\n"): (typeof documents)["\n  mutation addComment(\n    $id: ID!\n    $rating: Int\n    $flag: FileFlag\n    $comment: String\n    $nickName: String\n  ) {\n    addComment(\n      id: $id\n      rating: $rating\n      flag: $flag\n      comment: $comment\n      nickName: $nickName\n    ) {\n      ...FileFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteBrandingMutation($folderId: ID!) {\n    deleteBranding(folderId: $folderId) {\n      ...FolderFragment\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteBrandingMutation($folderId: ID!) {\n    deleteBranding(folderId: $folderId) {\n      ...FolderFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditAdminUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $password: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n    $ntfy: String\n    $ntfyEmail: Boolean\n  ) {\n    editAdminUser(\n      id: $id\n      name: $name\n      username: $username\n      password: $password\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n      ntfy: $ntfy\n      ntfyEmail: $ntfyEmail\n    ) {\n      ...UserFragment\n    }\n  }\n"): (typeof documents)["\n  mutation EditAdminUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $password: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n    $ntfy: String\n    $ntfyEmail: Boolean\n  ) {\n    editAdminUser(\n      id: $id\n      name: $name\n      username: $username\n      password: $password\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n      ntfy: $ntfy\n      ntfyEmail: $ntfyEmail\n    ) {\n      ...UserFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditBrandingMutation(\n    $folderId: ID!\n    $mode: ThemeMode\n    $primaryColor: PrimaryColor\n    $logoUrl: String\n  ) {\n    editBranding(\n      folderId: $folderId\n      mode: $mode\n      primaryColor: $primaryColor\n      logoUrl: $logoUrl\n    ) {\n      ...FolderFragment\n    }\n  }\n"): (typeof documents)["\n  mutation EditBrandingMutation(\n    $folderId: ID!\n    $mode: ThemeMode\n    $primaryColor: PrimaryColor\n    $logoUrl: String\n  ) {\n    editBranding(\n      folderId: $folderId\n      mode: $mode\n      primaryColor: $primaryColor\n      logoUrl: $logoUrl\n    ) {\n      ...FolderFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation editFolder($folderId: ID!, $heroImageId: ID!) {\n    editFolder(folderId: $folderId, heroImageId: $heroImageId) {\n      ...FolderFragment\n      ...HeroImageFragment\n    }\n  }\n"): (typeof documents)["\n  mutation editFolder($folderId: ID!, $heroImageId: ID!) {\n    editFolder(folderId: $folderId, heroImageId: $heroImageId) {\n      ...FolderFragment\n      ...HeroImageFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditUserDeviceMutation(\n    $token: String!\n    $name: String!\n    $userId: ID!\n    $enabled: Boolean!\n  ) {\n    editUserDevice(\n      notificationToken: $token\n      userId: $userId\n      enabled: $enabled\n      name: $name\n    ) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n"): (typeof documents)["\n  mutation EditUserDeviceMutation(\n    $token: String!\n    $name: String!\n    $userId: ID!\n    $enabled: Boolean!\n  ) {\n    editUserDevice(\n      notificationToken: $token\n      userId: $userId\n      enabled: $enabled\n      name: $name\n    ) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation EditUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      username: $username\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n    ) {\n      ...UserFragment\n    }\n  }\n"): (typeof documents)["\n  mutation EditUserMutation(\n    $id: ID\n    $name: String\n    $username: String\n    $uuid: String\n    $enabled: Boolean\n    $folderId: ID\n    $commentPermissions: CommentPermissions\n  ) {\n    editUser(\n      id: $id\n      name: $name\n      username: $username\n      uuid: $uuid\n      enabled: $enabled\n      folderId: $folderId\n      commentPermissions: $commentPermissions\n    ) {\n      ...UserFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }"): (typeof documents)["\n    mutation generateThumbnailsQuery($folderId: ID!) {\n        generateThumbnails(folderId: $folderId)\n    }"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n"): (typeof documents)["\n  mutation GenerateZip($folderId: ID!) {\n    generateZip(folderId: $folderId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n"): (typeof documents)["\n  mutation login($username: String!, $password: String!) {\n    auth(user: $username, password: $password)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RenameFolder(\n    $folderId: ID!\n    $oldPath: String!\n    $newPath: String!\n  ) {\n    renameFolder(folderId: $folderId, oldPath: $oldPath, newPath: $newPath) {\n      ...FolderFragment\n    }\n  }\n"): (typeof documents)["\n  mutation RenameFolder(\n    $folderId: ID!\n    $oldPath: String!\n    $newPath: String!\n  ) {\n    renameFolder(folderId: $folderId, oldPath: $oldPath, newPath: $newPath) {\n      ...FolderFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AccessLogsQuery(\n    $folderId: ID!\n    $userId: ID\n    $includeChildren: Boolean\n    $userType: UserType\n  ) {\n    accessLogs(\n      folderId: $folderId\n      userId: $userId\n      includeChildren: $includeChildren\n      userType: $userType\n    ) {\n      id\n      timestamp\n      type\n      userId\n      folderId\n      ipAddress\n      userAgent\n      folder {\n        ...FolderFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  query AccessLogsQuery(\n    $folderId: ID!\n    $userId: ID\n    $includeChildren: Boolean\n    $userType: UserType\n  ) {\n    accessLogs(\n      folderId: $folderId\n      userId: $userId\n      includeChildren: $includeChildren\n      userType: $userType\n    ) {\n      id\n      timestamp\n      type\n      userId\n      folderId\n      ipAddress\n      userAgent\n      folder {\n        ...FolderFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query commentHistoryQuery($fileId: ID, $folderId: ID) {\n    comments(fileId: $fileId, folderId: $folderId) {\n      id\n      comment\n      systemGenerated\n      timestamp\n      userId\n      file {\n        ...FileFragment\n      }\n      user {\n        id\n        gravatar\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query commentHistoryQuery($fileId: ID, $folderId: ID) {\n    comments(fileId: $fileId, folderId: $folderId) {\n      id\n      comment\n      systemGenerated\n      timestamp\n      userId\n      file {\n        ...FileFragment\n      }\n      user {\n        id\n        gravatar\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query generateThumbnailsStats($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalImages\n        }\n    }\n"): (typeof documents)["\n    query generateThumbnailsStats($folderId: ID!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n            totalImages\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ManageFolderQuery($folderId: ID!, $includeParents: Boolean!, $includeChildren: Boolean!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n        }\n        users(folderId:$folderId, includeParents: $includeParents, includeChildren: $includeChildren) {\n           ...UserFragment\n           folderId\n            folder {\n                ...FolderFragment\n            }\n        }\n    }\n"): (typeof documents)["\n    query ManageFolderQuery($folderId: ID!, $includeParents: Boolean!, $includeChildren: Boolean!) {\n        folder(id: $folderId) {\n            ...FolderFragment\n        }\n        users(folderId:$folderId, includeParents: $includeParents, includeChildren: $includeChildren) {\n           ...UserFragment\n           folderId\n            folder {\n                ...FolderFragment\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query MeQuery {\n    me {\n      id\n      userType\n      name\n      folderId\n      uuid\n      commentPermissions\n      folder {\n        id\n        name\n      }\n    }\n    clientInfo {\n      baseUrl\n      avifEnabled\n      canWrite\n    }\n  }\n"): (typeof documents)["\n  query MeQuery {\n    me {\n      id\n      userType\n      name\n      folderId\n      uuid\n      commentPermissions\n      folder {\n        id\n        name\n      }\n    }\n    clientInfo {\n      baseUrl\n      avifEnabled\n      canWrite\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query readAllFoldersQuery($id: ID!, $sort: FoldersSortType, $limit: Int) {\n    allFolders(id: $id, sort: $sort, limit: $limit) {\n      ...FolderFragment\n    }\n  }\n"): (typeof documents)["\n  query readAllFoldersQuery($id: ID!, $sort: FoldersSortType, $limit: Int) {\n    allFolders(id: $id, sort: $sort, limit: $limit) {\n      ...FolderFragment\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query RecentUsersQuery($folderId: ID!) {\n    users(folderId: $folderId, sortByRecent: true, includeChildren: true) {\n      id\n      name\n      folderId\n      lastAccess\n      gravatar\n      folder {\n        id\n        name\n        parents {\n          id\n          name\n        }\n        ...HeroImageFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  query RecentUsersQuery($folderId: ID!) {\n    users(folderId: $folderId, sortByRecent: true, includeChildren: true) {\n      id\n      name\n      folderId\n      lastAccess\n      gravatar\n      folder {\n        id\n        name\n        parents {\n          id\n          name\n        }\n        ...HeroImageFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query searchQuery($folderId: ID!, $query: String!) {\n    searchFolders(folderId: $folderId, query: $query) {\n      ...FolderFragment\n    }\n    searchFiles(folderId: $folderId, query: $query) {\n      ...FileFragment\n      folder {\n        ...MinimumFolderFragment\n      }\n    }\n  }\n"): (typeof documents)["\n  query searchQuery($folderId: ID!, $query: String!) {\n    searchFolders(folderId: $folderId, query: $query) {\n      ...FolderFragment\n    }\n    searchFiles(folderId: $folderId, query: $query) {\n      ...FileFragment\n      folder {\n        ...MinimumFolderFragment\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query serverInfoQuery {\n    serverInfo {\n      version\n      latest\n      databaseUrl\n      dev\n      usePolling\n      host\n      canWrite\n    }\n  }\n"): (typeof documents)["\n  query serverInfoQuery {\n    serverInfo {\n      version\n      latest\n      databaseUrl\n      dev\n      usePolling\n      host\n      canWrite\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query expensiveServerFileSizeQuery {\n    serverInfo {\n      cacheSize\n      mediaSize\n    }\n  }\n"): (typeof documents)["\n  query expensiveServerFileSizeQuery {\n    serverInfo {\n      cacheSize\n      mediaSize\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n"): (typeof documents)["\n  query TaskQuery($folderId: ID!) {\n    tasks(folderId: $folderId) {\n      id\n      name\n      step\n      totalSteps\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserDeviceQuery($userId: ID!, $token: String!) {\n    userDevices(userId: $userId, notificationToken: $token) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n"): (typeof documents)["\n  query UserDeviceQuery($userId: ID!, $token: String!) {\n    userDevices(userId: $userId, notificationToken: $token) {\n      userId\n      enabled\n      name\n      notificationToken\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n"): (typeof documents)["\n    query ViewAdminsQuery {\n        admins {\n            ...UserFragment\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewBrandingsQuery {\n        brandings {\n            id\n            logoUrl\n            primaryColor\n            mode\n            folderId\n            folder {\n               ...MinimumFolderFragment\n            }\n        }\n    }\n"): (typeof documents)["\n    query ViewBrandingsQuery {\n        brandings {\n            id\n            logoUrl\n            primaryColor\n            mode\n            folderId\n            folder {\n               ...MinimumFolderFragment\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n"): (typeof documents)["\n    query ViewFile($fileId: ID!) {\n        file(id:$fileId) {\n            ...FileFragment\n            ...ImageMetadataFragment\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n                users {\n                    id\n                    name\n                    enabled\n                    commentPermissions\n                    gravatar\n                }\n            }\n        }\n    }\n"): (typeof documents)["\n    query ViewFolder($folderId: ID!) {\n        folder(id:$folderId) {\n            ...FolderFragment\n            files {\n                ...FileFragment\n            }\n            subFolders {\n                ...MinimumFolderFragment\n                users {\n                    id\n                    name\n                    enabled\n                    commentPermissions\n                    gravatar\n                }\n            }\n        }\n    }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n"): (typeof documents)["\n    query ViewUserQuery($id: ID!) {\n        user(id:$id) {\n            ...UserFragment\n            \n        }\n    }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;