export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: string; output: string; }
  DateTime: { input: string; output: string; }
  JSON: { input: unknown; output: unknown; }
};

export type AccessLog = {
  __typename?: 'AccessLog';
  folder?: Maybe<Folder>;
  folderId?: Maybe<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  ipAddress?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
  type: AccessType;
  user?: Maybe<User>;
  userAgent?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export enum AccessType {
  Download = 'Download',
  View = 'View'
}

export enum BannerSize {
  Cinematic = 'cinematic',
  Classic = 'classic',
  Full = 'full',
  Widescreen = 'widescreen'
}

export enum BannerTextHAlign {
  Center = 'center',
  Left = 'left',
  Right = 'right'
}

export enum BannerTextVAlign {
  Bottom = 'bottom',
  Center = 'center',
  Top = 'top'
}

export type BenchmarkResult = {
  __typename?: 'BenchmarkResult';
  appVersion: Scalars['String']['output'];
  assetPath: Scalars['String']['output'];
  assetSourceUrl: Scalars['String']['output'];
  cpuCount: Scalars['Int']['output'];
  imageCount: Scalars['Int']['output'];
  steps: Array<NamedBenchmarkStep>;
  totalMs: Scalars['Float']['output'];
  uvThreadpoolSize: Scalars['String']['output'];
  videoAccelerationMode: Scalars['String']['output'];
  videoAccelerationReason: Scalars['String']['output'];
  videoCount: Scalars['Int']['output'];
};

export type Branding = {
  __typename?: 'Branding';
  availableViews?: Maybe<Array<Scalars['String']['output']>>;
  defaultFileSort?: Maybe<Scalars['String']['output']>;
  defaultView?: Maybe<Scalars['String']['output']>;
  folder?: Maybe<Folder>;
  folderId?: Maybe<Scalars['ID']['output']>;
  folders: Array<Folder>;
  footerTitle?: Maybe<Scalars['String']['output']>;
  footerUrl?: Maybe<Scalars['String']['output']>;
  galleryLayout?: Maybe<GalleryLayout>;
  headingAlignment?: Maybe<HeadingAlignment>;
  headingFontKey?: Maybe<HeadingFontKey>;
  headingFontSize?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  logoUrl?: Maybe<Scalars['String']['output']>;
  mode?: Maybe<ThemeMode>;
  name?: Maybe<Scalars['String']['output']>;
  primaryColor?: Maybe<PrimaryColor>;
  socialLinks?: Maybe<Scalars['JSON']['output']>;
  thumbnailBorderRadius?: Maybe<Scalars['Int']['output']>;
  thumbnailSize?: Maybe<Scalars['Int']['output']>;
  thumbnailSpacing?: Maybe<Scalars['Int']['output']>;
};

export type ClientInfo = {
  __typename?: 'ClientInfo';
  baseUrl: Scalars['String']['output'];
  canWrite: Scalars['Boolean']['output'];
  thumbnailJpegQuality: Scalars['Int']['output'];
  thumbnailVariants: Array<ThumbnailVariant>;
  useOriginalsForLightbox: Scalars['Boolean']['output'];
};

export type Comment = {
  __typename?: 'Comment';
  comment?: Maybe<Scalars['String']['output']>;
  file?: Maybe<FileInterface>;
  id?: Maybe<Scalars['ID']['output']>;
  systemGenerated: Scalars['Boolean']['output'];
  timestamp: Scalars['DateTime']['output'];
  user?: Maybe<User>;
  userId?: Maybe<Scalars['ID']['output']>;
};

export enum CommentPermissions {
  Edit = 'edit',
  None = 'none',
  Read = 'read'
}

export type DashboardStats = {
  __typename?: 'DashboardStats';
  totalFiles: Scalars['Int']['output'];
  totalFolders: Scalars['Int']['output'];
  totalImages: Scalars['Int']['output'];
  totalSize: Scalars['String']['output'];
};

export type DashboardUpdateInfo = {
  __typename?: 'DashboardUpdateInfo';
  latest: Scalars['String']['output'];
  version: Scalars['String']['output'];
};

export type DiskInfo = {
  __typename?: 'DiskInfo';
  free: Scalars['BigInt']['output'];
  path: Scalars['String']['output'];
  total: Scalars['BigInt']['output'];
};

export type EditServerSettingsInput = {
  thumbnailJpegQuality?: InputMaybe<Scalars['Int']['input']>;
  useOriginalsForLightbox?: InputMaybe<Scalars['Boolean']['input']>;
};

export type File = FileInterface & {
  __typename?: 'File';
  fileCreated: Scalars['DateTime']['output'];
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export enum FileFlag {
  Approved = 'approved',
  None = 'none',
  Rejected = 'rejected'
}

export type FileInterface = {
  fileCreated: Scalars['DateTime']['output'];
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export enum FileType {
  File = 'File',
  Image = 'Image',
  Video = 'Video'
}

export type Folder = {
  __typename?: 'Folder';
  bannerImage?: Maybe<Image>;
  bannerSize?: Maybe<BannerSize>;
  bannerTextHAlign?: Maybe<BannerTextHAlign>;
  bannerTextVAlign?: Maybe<BannerTextVAlign>;
  branding?: Maybe<Branding>;
  brandingId?: Maybe<Scalars['ID']['output']>;
  files: Array<FileInterface>;
  folderLastModified: Scalars['DateTime']['output'];
  heroImage?: Maybe<FileInterface>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['ID']['output']>;
  parents: Array<Folder>;
  permissions?: Maybe<FolderPermissions>;
  relativePath: Scalars['String']['output'];
  subFolders: Array<Folder>;
  subtitle?: Maybe<Scalars['String']['output']>;
  thumbnailCompletion: ThumbnailCompletion;
  title?: Maybe<Scalars['String']['output']>;
  totalDirectSize: Scalars['String']['output'];
  totalFiles: Scalars['Int']['output'];
  totalFolders: Scalars['Int']['output'];
  totalImages: Scalars['Int']['output'];
  totalSize: Scalars['String']['output'];
  users?: Maybe<Array<User>>;
};


export type FolderThumbnailCompletionArgs = {
  mediaType?: InputMaybe<MediaTypeFilter>;
};

export type FolderFileExport = {
  __typename?: 'FolderFileExport';
  file: FileInterface;
  relativePath: Scalars['String']['output'];
};

export type FolderFilesResult = {
  __typename?: 'FolderFilesResult';
  files: Array<FolderFileExport>;
  totalAvailable: Scalars['Int']['output'];
  totalReturned: Scalars['Int']['output'];
  truncated: Scalars['Boolean']['output'];
};

export enum FolderPermissions {
  Admin = 'Admin',
  None = 'None',
  View = 'View'
}

export enum FoldersSortType {
  FolderLastModified = 'folderLastModified',
  Name = 'name'
}

export enum GalleryLayout {
  Justified = 'justified',
  Masonry = 'masonry'
}

export enum HeadingAlignment {
  Center = 'center',
  Left = 'left'
}

export enum HeadingFontKey {
  AbrilFatface = 'abrilFatface',
  AmaticSc = 'amaticSc',
  AtkinsonHyperlegibleMono = 'atkinsonHyperlegibleMono',
  AtkinsonHyperlegibleNext = 'atkinsonHyperlegibleNext',
  BebasNeue = 'bebasNeue',
  DancingScript = 'dancingScript',
  Default = 'default',
  Inter = 'inter',
  JetbrainsMono = 'jetbrainsMono',
  LibreBaskerville = 'libreBaskerville',
  Lora = 'lora',
  Manrope = 'manrope',
  Merriweather = 'merriweather',
  MerriweatherSans = 'merriweatherSans',
  Montserrat = 'montserrat',
  OleoScript = 'oleoScript',
  Pacifico = 'pacifico',
  PinyonScript = 'pinyonScript',
  PoiretOne = 'poiretOne',
  Signika = 'signika',
  SourceSans3 = 'sourceSans3'
}

export type Image = FileInterface & {
  __typename?: 'Image';
  blurHash?: Maybe<Scalars['String']['output']>;
  fileCreated: Scalars['DateTime']['output'];
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageHeight?: Maybe<Scalars['Int']['output']>;
  imageRatio?: Maybe<Scalars['Float']['output']>;
  imageWidth?: Maybe<Scalars['Int']['output']>;
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  metadata?: Maybe<ImageMetadataSummary>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export type ImageMetadataSummary = {
  __typename?: 'ImageMetadataSummary';
  Aperture?: Maybe<Scalars['Float']['output']>;
  Artist?: Maybe<Scalars['String']['output']>;
  Camera?: Maybe<Scalars['String']['output']>;
  DateTimeEdit?: Maybe<Scalars['String']['output']>;
  DateTimeOriginal?: Maybe<Scalars['String']['output']>;
  ExposureTime?: Maybe<Scalars['Float']['output']>;
  Height?: Maybe<Scalars['Int']['output']>;
  ISO?: Maybe<Scalars['Float']['output']>;
  Lens?: Maybe<Scalars['String']['output']>;
  Rating?: Maybe<Scalars['Int']['output']>;
  Width?: Maybe<Scalars['Int']['output']>;
};

export type InodeSupportInfo = {
  __typename?: 'InodeSupportInfo';
  reason: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export enum LinkMode {
  FinalDelivery = 'final_delivery',
  ProofNoDownloads = 'proof_no_downloads'
}

export type MediaCapsInfo = {
  __typename?: 'MediaCapsInfo';
  heic: Scalars['Boolean']['output'];
  psb: Scalars['Boolean']['output'];
  psd: Scalars['Boolean']['output'];
  raw: Scalars['Boolean']['output'];
};

export type MediaScanningInfo = {
  __typename?: 'MediaScanningInfo';
  fileWatcherMode: Scalars['String']['output'];
  onViewScanMode: Scalars['String']['output'];
  ping: PingStatusInfo;
  scheduledScan: ScheduledScanStatusInfo;
  scheduledScanHours: Scalars['Int']['output'];
};

export enum MediaTypeFilter {
  All = 'All',
  Image = 'Image',
  Video = 'Video'
}

export type Mutation = {
  __typename?: 'Mutation';
  addComment: FileInterface;
  auth: Scalars['String']['output'];
  deleteBranding: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  editAdminUser: User;
  editBranding: Branding;
  editFolder: Folder;
  editServerSettings: ServerSettings;
  editUser: User;
  editUserDevice: UserDevice;
  generateThumbnails: Scalars['Boolean']['output'];
  generateZip: Scalars['String']['output'];
  recordFolderVisit: Scalars['Boolean']['output'];
  renameFolder: Folder;
  rescanFolder: Scalars['Boolean']['output'];
  runBenchmark: BenchmarkResult;
  setFolderBranding: Folder;
};


export type MutationAddCommentArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  flag?: InputMaybe<FileFlag>;
  id: Scalars['ID']['input'];
  nickName?: InputMaybe<Scalars['String']['input']>;
  rating?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationAuthArgs = {
  password: Scalars['String']['input'];
  user: Scalars['String']['input'];
};


export type MutationDeleteBrandingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEditAdminUserArgs = {
  commentPermissions?: InputMaybe<CommentPermissions>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  ntfy?: InputMaybe<Scalars['String']['input']>;
  ntfyEmail?: InputMaybe<Scalars['Boolean']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditBrandingArgs = {
  availableViews?: InputMaybe<Array<Scalars['String']['input']>>;
  defaultFileSort?: InputMaybe<Scalars['String']['input']>;
  defaultView?: InputMaybe<Scalars['String']['input']>;
  footerTitle?: InputMaybe<Scalars['String']['input']>;
  footerUrl?: InputMaybe<Scalars['String']['input']>;
  galleryLayout?: InputMaybe<GalleryLayout>;
  headingAlignment?: InputMaybe<HeadingAlignment>;
  headingFontKey?: InputMaybe<HeadingFontKey>;
  headingFontSize?: InputMaybe<Scalars['Int']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  logoUrl?: InputMaybe<Scalars['String']['input']>;
  mode?: InputMaybe<ThemeMode>;
  name?: InputMaybe<Scalars['String']['input']>;
  primaryColor?: InputMaybe<PrimaryColor>;
  socialLinks?: InputMaybe<Scalars['JSON']['input']>;
  thumbnailBorderRadius?: InputMaybe<Scalars['Int']['input']>;
  thumbnailSize?: InputMaybe<Scalars['Int']['input']>;
  thumbnailSpacing?: InputMaybe<Scalars['Int']['input']>;
};


export type MutationEditFolderArgs = {
  bannerImageId?: InputMaybe<Scalars['ID']['input']>;
  bannerSize?: InputMaybe<BannerSize>;
  bannerTextHAlign?: InputMaybe<BannerTextHAlign>;
  bannerTextVAlign?: InputMaybe<BannerTextVAlign>;
  folderId: Scalars['ID']['input'];
  heroImageId?: InputMaybe<Scalars['ID']['input']>;
  subtitle?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditServerSettingsArgs = {
  input: EditServerSettingsInput;
};


export type MutationEditUserArgs = {
  commentPermissions?: InputMaybe<CommentPermissions>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  expiresAt?: InputMaybe<Scalars['DateTime']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  galleryPasscode?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  linkMode?: InputMaybe<LinkMode>;
  name?: InputMaybe<Scalars['String']['input']>;
  username?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['String']['input']>;
};


export type MutationEditUserDeviceArgs = {
  enabled: Scalars['Boolean']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  notificationToken: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationGenerateThumbnailsArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
  mediaType?: InputMaybe<MediaTypeFilter>;
};


export type MutationGenerateZipArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type MutationRecordFolderVisitArgs = {
  folderId: Scalars['ID']['input'];
};


export type MutationRenameFolderArgs = {
  folderId: Scalars['ID']['input'];
  newPath: Scalars['String']['input'];
  oldPath: Scalars['String']['input'];
};


export type MutationRescanFolderArgs = {
  folderId: Scalars['ID']['input'];
};


export type MutationRunBenchmarkArgs = {
  assetPath?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSetFolderBrandingArgs = {
  brandingId?: InputMaybe<Scalars['ID']['input']>;
  folderId: Scalars['ID']['input'];
};

export type NamedBenchmarkStep = {
  __typename?: 'NamedBenchmarkStep';
  details?: Maybe<Scalars['String']['output']>;
  includedInTotal: Scalars['Boolean']['output'];
  key: Scalars['String']['output'];
  ms?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  outputBytes?: Maybe<Scalars['BigInt']['output']>;
  skippedReason?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type PingCoordinatorStatusInfo = {
  __typename?: 'PingCoordinatorStatusInfo';
  foldersScanned: Scalars['Int']['output'];
  lastError?: Maybe<Scalars['String']['output']>;
  pendingFolders: Scalars['Int']['output'];
  state: Scalars['String']['output'];
};

export type PingSourceStatusInfo = {
  __typename?: 'PingSourceStatusInfo';
  hintsReceived: Scalars['Int']['output'];
  instanceId: Scalars['String']['output'];
  lastBatchAt?: Maybe<Scalars['String']['output']>;
  lastError?: Maybe<Scalars['String']['output']>;
  lastReconcileAt?: Maybe<Scalars['String']['output']>;
  lastSeenAt: Scalars['String']['output'];
  name: Scalars['String']['output'];
  pingVersion: Scalars['String']['output'];
  watchPrefix: Scalars['String']['output'];
};

export type PingStatusInfo = {
  __typename?: 'PingStatusInfo';
  coordinator: PingCoordinatorStatusInfo;
  enabled: Scalars['Boolean']['output'];
  sources: Array<PingSourceStatusInfo>;
};

export enum PrimaryColor {
  Blue = 'blue',
  Cyan = 'cyan',
  Dark = 'dark',
  Grape = 'grape',
  Gray = 'gray',
  Green = 'green',
  Indigo = 'indigo',
  Lime = 'lime',
  Orange = 'orange',
  Pink = 'pink',
  Red = 'red',
  Teal = 'teal',
  Violet = 'violet',
  Yellow = 'yellow'
}

export enum PublicLinkAccessStatus {
  Available = 'AVAILABLE',
  Expired = 'EXPIRED',
  PasscodeRequired = 'PASSCODE_REQUIRED',
  Unavailable = 'UNAVAILABLE'
}

export type PublicLinkBrandingPreview = {
  __typename?: 'PublicLinkBrandingPreview';
  headingAlignment?: Maybe<HeadingAlignment>;
  headingFontKey?: Maybe<HeadingFontKey>;
  headingFontSize?: Maybe<Scalars['Int']['output']>;
  mode?: Maybe<ThemeMode>;
  primaryColor?: Maybe<PrimaryColor>;
};

export type PublicLinkInfo = {
  __typename?: 'PublicLinkInfo';
  /** @deprecated Use status. */
  available: Scalars['Boolean']['output'];
  branding?: Maybe<PublicLinkBrandingPreview>;
  /** Expiration timestamp for available and expired links. Available links carry it so a client holding a cached AVAILABLE result can still name the deadline the moment a request is rejected as expired; do not restrict this to EXPIRED. Hidden while a passcode is required and for unavailable links. */
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  galleryName?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use status. */
  requiresPasscode: Scalars['Boolean']['output'];
  status: PublicLinkAccessStatus;
  /** @deprecated Use status. */
  unlocked: Scalars['Boolean']['output'];
};

export type Query = {
  __typename?: 'Query';
  accessLogs: Array<AccessLog>;
  admins: Array<User>;
  allFolders: Array<Maybe<Folder>>;
  brandings: Array<Branding>;
  clientInfo?: Maybe<ClientInfo>;
  comments: Array<Comment>;
  dashboardStats: DashboardStats;
  dashboardUpdateInfo: DashboardUpdateInfo;
  file: FileInterface;
  folder: Folder;
  folderFiles: FolderFilesResult;
  me?: Maybe<User>;
  publicLinkInfo: PublicLinkInfo;
  searchFiles: Array<File>;
  searchFolders: Array<Folder>;
  serverInfo?: Maybe<ServerInfo>;
  tasks: Array<Task>;
  user: User;
  userDevices: Array<UserDevice>;
  users: Array<User>;
};


export type QueryAccessLogsArgs = {
  folderId: Scalars['ID']['input'];
  includeChildren?: InputMaybe<Scalars['Boolean']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
  userType?: InputMaybe<UserType>;
};


export type QueryAllFoldersArgs = {
  id: Scalars['ID']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  sort?: InputMaybe<FoldersSortType>;
};


export type QueryCommentsArgs = {
  fileId?: InputMaybe<Scalars['ID']['input']>;
  folderId?: InputMaybe<Scalars['ID']['input']>;
  includeChildren?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDashboardStatsArgs = {
  folderId: Scalars['ID']['input'];
};


export type QueryFileArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFolderArgs = {
  id: Scalars['ID']['input'];
};


export type QueryFolderFilesArgs = {
  folderId: Scalars['ID']['input'];
  includeSubfolders?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicLinkInfoArgs = {
  uuid: Scalars['String']['input'];
};


export type QuerySearchFilesArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
  query: Scalars['String']['input'];
};


export type QuerySearchFoldersArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
  query: Scalars['String']['input'];
};


export type QueryTasksArgs = {
  folderId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserDevicesArgs = {
  notificationToken?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryUsersArgs = {
  folderId: Scalars['ID']['input'];
  includeChildren?: InputMaybe<Scalars['Boolean']['input']>;
  includeParents?: InputMaybe<Scalars['Boolean']['input']>;
  sortByRecent?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ScheduledScanResultInfo = {
  __typename?: 'ScheduledScanResultInfo';
  addedFiles: Scalars['Int']['output'];
  addedFolders: Scalars['Int']['output'];
  changedFiles: Scalars['Int']['output'];
  cleanupRun: Scalars['Boolean']['output'];
  completed: Scalars['Boolean']['output'];
  ignored: Scalars['Int']['output'];
  movedFiles: Scalars['Int']['output'];
  movedFolders: Scalars['Int']['output'];
  removedFiles: Scalars['Int']['output'];
  removedFolders: Scalars['Int']['output'];
  scanPasses: Scalars['Int']['output'];
  skippedEntries: Scalars['Int']['output'];
  unsettledFiles: Scalars['Int']['output'];
  unsettledFolders: Scalars['Int']['output'];
};

export type ScheduledScanStatusInfo = {
  __typename?: 'ScheduledScanStatusInfo';
  lastCompletedAt?: Maybe<Scalars['String']['output']>;
  lastDurationMs?: Maybe<Scalars['Int']['output']>;
  lastError?: Maybe<Scalars['String']['output']>;
  lastResult?: Maybe<ScheduledScanResultInfo>;
  lastStartedAt?: Maybe<Scalars['String']['output']>;
  nextScanAt?: Maybe<Scalars['String']['output']>;
  running: Scalars['Boolean']['output'];
};

export type ServerInfo = {
  __typename?: 'ServerInfo';
  cacheSize: Scalars['BigInt']['output'];
  canWrite: Scalars['Boolean']['output'];
  databaseUrl: Scalars['String']['output'];
  dev: Scalars['Boolean']['output'];
  developmentBuildSha?: Maybe<Scalars['String']['output']>;
  disk?: Maybe<DiskInfo>;
  host: Scalars['String']['output'];
  inodeSupport: InodeSupportInfo;
  latest: Scalars['String']['output'];
  mediaCaps: MediaCapsInfo;
  mediaSize: Scalars['BigInt']['output'];
  scanning: MediaScanningInfo;
  settings: ServerSettings;
  system: SystemInfo;
  version: Scalars['String']['output'];
  videoAcceleration: VideoAccelerationInfo;
};

export type ServerSettings = {
  __typename?: 'ServerSettings';
  thumbnailJpegQuality: Scalars['Int']['output'];
  thumbnailVariants: Array<ThumbnailVariant>;
  useOriginalsForLightbox: Scalars['Boolean']['output'];
};

export type SystemInfo = {
  __typename?: 'SystemInfo';
  databaseVersion?: Maybe<Scalars['String']['output']>;
  ffmpegVersion?: Maybe<Scalars['String']['output']>;
  imageMagickVersion?: Maybe<Scalars['String']['output']>;
  nodeVersion: Scalars['String']['output'];
  platform: Scalars['String']['output'];
  totalMemory: Scalars['BigInt']['output'];
  uptimeSeconds: Scalars['Int']['output'];
};

export type Task = {
  __typename?: 'Task';
  folder?: Maybe<Folder>;
  id?: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  startTime?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  step?: Maybe<Scalars['Int']['output']>;
  totalSteps?: Maybe<Scalars['Int']['output']>;
};

export enum ThemeMode {
  Auto = 'auto',
  Dark = 'dark',
  Light = 'light'
}

export type ThumbnailCompletion = {
  __typename?: 'ThumbnailCompletion';
  completeFiles: Scalars['Int']['output'];
  incompleteFiles: Scalars['Int']['output'];
  missingArtifacts: Scalars['Int']['output'];
  totalArtifacts: Scalars['Int']['output'];
  totalFiles: Scalars['Int']['output'];
};

export type ThumbnailVariant = {
  __typename?: 'ThumbnailVariant';
  format: Scalars['String']['output'];
  mimeType: Scalars['String']['output'];
  quality: Scalars['Int']['output'];
  token: Scalars['String']['output'];
  width: Scalars['Int']['output'];
};

export type User = {
  __typename?: 'User';
  commentPermissions?: Maybe<CommentPermissions>;
  deleted?: Maybe<Scalars['Boolean']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  galleryPasscode?: Maybe<Scalars['String']['output']>;
  gravatar?: Maybe<Scalars['String']['output']>;
  hasGalleryPasscode: Scalars['Boolean']['output'];
  id?: Maybe<Scalars['ID']['output']>;
  lastAccess?: Maybe<Scalars['DateTime']['output']>;
  linkMode?: Maybe<LinkMode>;
  name?: Maybe<Scalars['String']['output']>;
  ntfy?: Maybe<Scalars['String']['output']>;
  ntfyEmail?: Maybe<Scalars['Boolean']['output']>;
  userType?: Maybe<UserType>;
  username?: Maybe<Scalars['String']['output']>;
  uuid?: Maybe<Scalars['String']['output']>;
};

export type UserDevice = {
  __typename?: 'UserDevice';
  enabled: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  notificationToken?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export enum UserType {
  Admin = 'Admin',
  All = 'All',
  Link = 'Link',
  User = 'User'
}

export type Video = FileInterface & {
  __typename?: 'Video';
  blurHash?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Float']['output']>;
  fileCreated: Scalars['DateTime']['output'];
  fileHash: Scalars['String']['output'];
  fileLastModified: Scalars['DateTime']['output'];
  fileSize: Scalars['BigInt']['output'];
  flag?: Maybe<FileFlag>;
  folder?: Maybe<Folder>;
  folderId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  imageHeight?: Maybe<Scalars['Int']['output']>;
  imageRatio?: Maybe<Scalars['Float']['output']>;
  imageWidth?: Maybe<Scalars['Int']['output']>;
  latestComment?: Maybe<Scalars['DateTime']['output']>;
  metadata?: Maybe<VideoMetadataSummary>;
  name: Scalars['String']['output'];
  rating?: Maybe<Scalars['Int']['output']>;
  totalComments?: Maybe<Scalars['Int']['output']>;
  type: FileType;
};

export type VideoAccelerationInfo = {
  __typename?: 'VideoAccelerationInfo';
  codecs: Array<Scalars['String']['output']>;
  driver?: Maybe<Scalars['String']['output']>;
  mode: Scalars['String']['output'];
  reason: Scalars['String']['output'];
};

export type VideoMetadataSummary = {
  __typename?: 'VideoMetadataSummary';
  AudioCodec?: Maybe<Scalars['String']['output']>;
  AudioCodecDescription?: Maybe<Scalars['String']['output']>;
  Bitrate?: Maybe<Scalars['Int']['output']>;
  Duration?: Maybe<Scalars['Float']['output']>;
  Format?: Maybe<Scalars['String']['output']>;
  Framerate?: Maybe<Scalars['Float']['output']>;
  Height?: Maybe<Scalars['Int']['output']>;
  VideoCodec?: Maybe<Scalars['String']['output']>;
  VideoCodecDescription?: Maybe<Scalars['String']['output']>;
  Width?: Maybe<Scalars['Int']['output']>;
};
