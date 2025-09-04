export interface IPicrConfiguration {
  baseUrl: string; // eg: https://picr.mydomain.com/
  tokenSecret?: string;
  databaseUrl?: string;
  debugSql?: boolean;
  consoleLogging?: boolean;
  usePolling?: boolean;
  port?: number;
  pollingInterval: number;
  dev?: boolean;
  version?: string;
  updateMetadata: boolean;
  cachePath: string;
  mediaPath: string;
  canWrite?: boolean;
}
