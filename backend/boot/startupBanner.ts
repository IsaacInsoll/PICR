import type { IPicrConfiguration } from '../config/IPicrConfiguration.js';
import { log } from '../logger.js';
import { banner, bannerRow, wrappedBannerRows } from '@shared/banner.js';

const logo = [
  ' ____  ___  ____ ____       ',
  '|  _ \\|_ _|/ ___|  _ \\      ',
  '| |_) || || |   | |_) |     ',
  '|  __/ | || |___|  _ <      ',
  '|_|   |___|\\____|_| \\_\\     ',
];

// Flips true once the server is fully up, so a later fatal error is labelled as
// a runtime crash rather than a startup failure.
let startupComplete = false;

export const logStartupBanner = (config: IPicrConfiguration) => {
  startupComplete = true;
  log('info', startupBanner(config), true);
};

export const logFatalBanner = (config: IPicrConfiguration, reason: string) => {
  log(
    'error',
    banner(logo, [
      bannerRow(
        '✖',
        startupComplete ? 'PICR Fatal Error' : 'PICR Startup Failed',
      ),
      bannerRow('■', 'Version', versionLabel(config)),
      bannerRow('■', 'Database', config.databaseUrl ?? 'not configured'),
      ...wrappedBannerRows('■', 'Reason', reason),
    ]),
    true,
  );
};

const startupBanner = (config: IPicrConfiguration) => {
  const supported = supportedCapabilities(config);
  const unsupported = unsupportedCapabilities(config);
  return banner(logo, [
    bannerRow('■', 'Version', versionLabel(config)),
    bannerRow('■', 'URL', config.baseUrl),
    ...(config.pingToken
      ? [bannerRow('■', 'PICR Ping', 'enabled, awaiting contact')]
      : []),
    ...(supported.length
      ? [bannerRow('■', 'Supported', supported.join(' · '))]
      : []),
    ...(unsupported.length
      ? [bannerRow('■', 'Unsupported', unsupported.join(' · '))]
      : []),
  ]);
};

const versionLabel = (config: IPicrConfiguration) => {
  return [
    config.version ?? 'DEV',
    config.dev ? '[DEV]' : undefined,
    buildLabel(config),
  ]
    .filter(Boolean)
    .join(' ');
};

// Only development (`commit-*`) builds set developmentBuildSha, so only they show
// a commit hash. Release builds (`latest` / a tagged version) leave it unset —
// gitSha is still set for the Docker provenance label but is never shown here.
const buildLabel = (config: IPicrConfiguration) =>
  config.developmentBuildSha ? shortSha(config.developmentBuildSha) : undefined;

const shortSha = (sha: string) => sha.slice(0, 12);

const supportedCapabilities = (config: IPicrConfiguration) => {
  const caps = config.mediaCaps;
  return [
    caps.raw ? 'RAW' : undefined,
    caps.psd ? 'PSD' : undefined,
    caps.psb ? 'PSB' : undefined,
    caps.heic ? 'HEIC' : undefined,
    config.videoAccelerationMode === 'vaapi' ? 'Video VAAPI' : 'Video CPU',
    config.canWrite ? 'media write' : undefined,
    config.inodeSupport === 'enabled' ? 'Inode tracking' : undefined,
  ].filter((value): value is string => Boolean(value));
};

const unsupportedCapabilities = (config: IPicrConfiguration) => {
  const caps = config.mediaCaps;
  return [
    caps.raw ? undefined : 'RAW',
    caps.psd ? undefined : 'PSD',
    caps.psb ? undefined : 'PSB',
    caps.heic ? undefined : 'HEIC',
    config.videoAcceleration === 'auto' &&
    config.videoAccelerationMode !== 'vaapi'
      ? 'VAAPI'
      : undefined,
    config.canWrite ? undefined : 'media write',
    config.inodeSupport === 'disabled' ? 'Inode tracking' : undefined,
  ].filter((value): value is string => Boolean(value));
};
