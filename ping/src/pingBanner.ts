import { banner, bannerRow, wrappedBannerRows } from '../../shared/banner.js';
import type { PingConfig } from './config.js';

const logo = [
  '  ___  ___  ___ ___          ',
  ' | _ \\|_ _|/ __| _ \\         ',
  ' |  _/ | || (__|   /         ',
  ' |_|  |___|\\___|_|_\\         ',
  '  ___ ___ _  _  ___          ',
  ' | _ \\_ _| \\| |/ __|  · ) )) ',
  ' |  _/| || .` | (_ |         ',
  ' |_| |___|_|\\_|\\___|         ',
];

const loggingLabel = (config: PingConfig) => {
  if (config.dryRun) return 'dry run — every change, nothing sent';
  if (config.verbose) return 'verbose — every detected change';
  return 'minimal — batch summaries only';
};

export const startupBanner = (config: PingConfig) =>
  banner(logo, [
    bannerRow('■', 'Version', config.version),
    bannerRow('■', 'Source', config.pingName),
    bannerRow(
      '■',
      'Target',
      config.dryRun ? 'DRY RUN (not sending)' : config.picrUrl?.toString(),
    ),
    bannerRow('■', 'Watching', `${config.watchRoot} (${config.watchMode})`),
    bannerRow('■', 'Logging', loggingLabel(config)),
  ]);

export const fatalBanner = (config: PingConfig, reason: string) =>
  banner(logo, [
    bannerRow('✖', 'PICR Ping Failed'),
    bannerRow('■', 'Version', config.version),
    bannerRow('■', 'Watching', config.watchRoot),
    ...wrappedBannerRows('■', 'Reason', reason),
  ]);
