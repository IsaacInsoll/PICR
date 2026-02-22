import { IPicrConfiguration } from './IPicrConfiguration.js';

export const picrConfig: IPicrConfiguration = {
  baseUrl: '',
  baseUrlOrigin: '',
  baseUrlPathname: '',
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
