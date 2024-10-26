export interface IPicrConfiguration {
  tokenSecret?: string;
  databaseUrl?: string;
  debugSql?: boolean;
  consoleLogging?: boolean;
  usePolling?: boolean;
  port?: number;
  pollingInterval?: number;
  dev?: boolean;
  version?: string;
  updateMetadata?: boolean;
  cachePath?: string;
  mediaPath?: string;
}
