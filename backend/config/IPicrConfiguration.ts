export interface IPicrConfiguration {
  baseUrl: string; // eg: https://picr.mydomain.com/
  baseUrlOrigin: string;
  baseUrlPathname: string;
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
  loginRateLimitEnabled?: boolean;
  loginRateLimitWindowMinutes?: number;
  loginRateLimitIpMaxAttempts?: number;
  loginRateLimitUserIpMaxAttempts?: number;
  loginRateLimitBlockMinutes?: number;
  loginRateLimitMaxBlockMinutes?: number;
}
