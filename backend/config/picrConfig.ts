import type { IPicrConfiguration } from './IPicrConfiguration.js';

export const picrConfig: IPicrConfiguration = {
  baseUrl: '',
  baseUrlOrigin: '',
  baseUrlPathname: '',
  ffmpegPath: undefined,
  ffprobePath: undefined,
  exiftoolPath: undefined,
  magickPath: undefined,
  mediaCaps: {
    raw: false,
    psd: false,
    psb: false,
    heic: false,
  },
  videoAcceleration: 'auto',
  videoAccelerationDevice: '/dev/dri/renderD128',
  videoAccelerationMode: 'cpu',
  videoAccelerationReason: 'Video acceleration not yet detected',
  cachePath: '',
  mediaPath: '',
  updateMetadata: false,
  pollingInterval: 20, //sensible default
  loginRateLimitEnabled: true,
  loginRateLimitWindowMinutes: 15,
  loginRateLimitIpMaxAttempts: 30,
  loginRateLimitUserIpMaxAttempts: 5,
  loginRateLimitBlockMinutes: 15,
  loginRateLimitMaxBlockMinutes: 60,
};
