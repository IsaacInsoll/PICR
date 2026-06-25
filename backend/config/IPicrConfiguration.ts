export interface IPicrConfiguration {
  baseUrl: string; // eg: https://picr.mydomain.com/
  baseUrlOrigin: string;
  baseUrlPathname: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  // Video acceleration config (from env) + resolved runtime status (set at
  // boot by detectVideoAcceleration). Mode/reason always populated; driver and
  // codecs only when VAAPI is active.
  videoAcceleration: 'auto' | 'off';
  videoAccelerationDevice: string;
  videoAccelerationMode: 'cpu' | 'vaapi';
  videoAccelerationReason: string;
  videoAccelerationDriver?: string;
  videoAccelerationCodecs?: string[];
  tokenSecret?: string;
  databaseUrl?: string;
  debugSql?: boolean;
  consoleLogging?: boolean;
  usePolling?: boolean;
  port?: number;
  pollingInterval: number;
  dev?: boolean;
  version?: string;
  buildChannel?: string;
  developmentBuildSha?: string;
  gitSha?: string;
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
  disableAccessLogs?: boolean;
}
