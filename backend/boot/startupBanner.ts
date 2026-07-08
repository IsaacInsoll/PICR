import type { IPicrConfiguration } from '../config/IPicrConfiguration.js';
import { log } from '../logger.js';

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
    banner([
      row('✖', startupComplete ? 'PICR Fatal Error' : 'PICR Startup Failed'),
      row('■', 'Version', versionLabel(config)),
      row('■', 'Database', config.databaseUrl ?? 'not configured'),
      ...wrappedRows('■', 'Reason', reason),
    ]),
    true,
  );
};

const startupBanner = (config: IPicrConfiguration) => {
  const supported = supportedCapabilities(config);
  const unsupported = unsupportedCapabilities(config);
  return banner([
    row('■', 'Version', versionLabel(config)),
    row('■', 'URL', config.baseUrl),
    ...(supported.length ? [row('■', 'Supported', supported.join(' · '))] : []),
    ...(unsupported.length
      ? [row('■', 'Unsupported', unsupported.join(' · '))]
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

const row = (icon: string, label: string, value?: string) =>
  value ? `${icon}  ${label.padEnd(12)} ${value}` : `${icon}  ${label}`;

const wrappedRows = (icon: string, label: string, value: string) => {
  const maxValueLength = 57;
  if (value.length <= maxValueLength) return [row(icon, label, value)];

  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxValueLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);

  return lines.map((text, index) =>
    index === 0 ? row(icon, label, text) : row(' ', '', text),
  );
};

const banner = (rows: string[]) => {
  const contentWidth = Math.max(72, ...rows.map((row) => row.length)) + 6;
  const boxTop = `┌${'─'.repeat(contentWidth)}┐`;
  const boxBottom = `└${'─'.repeat(contentWidth)}┘`;
  const boxRows = rows.map((row) => `│  ${row.padEnd(contentWidth - 2)}│`);

  const logo = [
    ' ____  ___  ____ ____       ',
    '|  _ \\|_ _|/ ___|  _ \\      ',
    '| |_) || || |   | |_) |     ',
    '|  __/ | || |___|  _ <      ',
    '|_|   |___|\\____|_| \\_\\     ',
  ];

  const box = [boxTop, ...boxRows, boxBottom];
  const height = Math.max(logo.length, box.length);
  return Array.from(
    { length: height },
    (_, index) =>
      `${logo[index] ?? ' '.repeat(logo[0].length)}${box[index] ?? ''}`,
  ).join('\n');
};
