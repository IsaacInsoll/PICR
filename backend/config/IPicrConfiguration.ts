export type FileWatcherMode = 'off' | 'native' | 'polling';
export type OnViewScanMode = 'off' | 'direct' | 'direct_and_new' | 'one_level';

export interface IPicrConfiguration {
  baseUrl: string; // eg: https://picr.mydomain.com/
  baseUrlOrigin: string;
  baseUrlPathname: string;
  ffmpegPath?: string;
  ffprobePath?: string;
  exiftoolPath?: string;
  magickPath?: string;
  // Tool versions captured at boot (best effort) for display in ServerInfo.
  ffmpegVersion?: string;
  imageMagickVersion?: string;
  mediaCaps: {
    raw: boolean;
    psd: boolean;
    psb: boolean;
    heic: boolean;
  };
  // Video acceleration config (from env) + resolved runtime status (set at
  // boot by detectVideoAcceleration). Mode/reason always populated; driver and
  // codecs only when VAAPI is active.
  videoAcceleration: 'auto' | 'off';
  videoAccelerationDevice: string;
  videoAccelerationMode: 'cpu' | 'vaapi';
  videoAccelerationReason: string;
  videoAccelerationDriver?: string;
  videoAccelerationCodecs?: string[];
  inodeSupport: 'enabled' | 'disabled' | 'unknown';
  inodeSupportReason: string;
  tokenSecret?: string;
  // Initial admin account for first boot (no users yet). Password falls back to
  // a generated random value when unset; see boot/envPassword.ts.
  adminUsername?: string;
  adminPassword?: string;
  databaseUrl?: string;
  debugSql?: boolean;
  consoleLogging?: boolean;
  fileWatcherMode: FileWatcherMode;
  onViewScanMode: OnViewScanMode;
  usePolling: boolean;
  port?: number;
  pollingSeconds: number;
  scheduledScanHours: number;
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
