import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync } from 'node:fs';
import { picrConfig } from '../config/picrConfig.js';
import { log } from '../logger.js';

// VAAPI capability probe run once at boot. It resolves picrConfig's video
// acceleration mode/driver/codecs so the benchmark and ServerInfo can report
// how video is being processed. It NEVER throws and NEVER exits the process:
// the worst case is falling back to CPU. Per-file CPU fallback at runtime still
// covers cases where a codec vainfo advertises can't actually be used.

const probeTimeoutMs = 5000;

// vainfo VAProfile names → friendly codec labels, in display order.
const codecLabels: { pattern: RegExp; label: string }[] = [
  { pattern: /VAProfileH264/, label: 'H.264' },
  { pattern: /VAProfileHEVC/, label: 'HEVC' },
  { pattern: /VAProfileAV1/, label: 'AV1' },
  { pattern: /VAProfileVP9/, label: 'VP9' },
  { pattern: /VAProfileVP8/, label: 'VP8' },
  { pattern: /VAProfileMPEG2/, label: 'MPEG-2' },
  { pattern: /VAProfileVC1/, label: 'VC-1' },
  { pattern: /VAProfileJPEG/, label: 'MJPEG' },
];

export const detectVideoAcceleration = async (): Promise<void> => {
  const { videoAcceleration, videoAccelerationDevice } = picrConfig;

  if (videoAcceleration === 'off') {
    useCpu('info', 'video acceleration is disabled (VIDEO_ACCELERATION=off)');
    return;
  }

  if (!existsSync(videoAccelerationDevice)) {
    useCpu('info', `${videoAccelerationDevice} is not available`);
    return;
  }

  const probe = spawnSync(
    'vainfo',
    ['--display', 'drm', '--device', videoAccelerationDevice],
    { encoding: 'utf8', timeout: probeTimeoutMs },
  );

  if (probe.error || probe.status !== 0) {
    // Device was present but VAAPI did not initialise. Log loudly (warn) so a
    // user who mounted /dev/dri expecting acceleration can see why it didn't.
    useCpu('warn', `VAAPI probe failed: ${probeFailureReason(probe)}`);
    return;
  }

  const driver = parseDriver(probe.stdout);
  const codecs = parseCodecs(probe.stdout);

  picrConfig.videoAccelerationMode = 'vaapi';
  picrConfig.videoAccelerationDriver = driver;
  picrConfig.videoAccelerationCodecs = codecs;
  picrConfig.videoAccelerationReason = driver
    ? `VAAPI active (${driver})`
    : 'VAAPI active';

  const detail = [driver, codecs.length ? codecs.join(', ') : undefined]
    .filter(Boolean)
    .join(' — ');
  log(
    'info',
    `🎬 Using VAAPI for video acceleration${detail ? ` — ${detail}` : ''}`,
    true,
  );
};

const useCpu = (level: 'info' | 'warn', reason: string): void => {
  picrConfig.videoAccelerationMode = 'cpu';
  picrConfig.videoAccelerationDriver = undefined;
  picrConfig.videoAccelerationCodecs = undefined;
  picrConfig.videoAccelerationReason = reason;
  log(level, `🎬 Using CPU only for video processing because ${reason}`, true);
};

const probeFailureReason = (probe: SpawnSyncReturns<string>): string => {
  if (probe.error) return probe.error.message;
  const output = (probe.stderr || probe.stdout || '').trim();
  const lastLine = output.split('\n').filter(Boolean).at(-1);
  return lastLine ?? `vainfo exited with status ${probe.status}`;
};

const parseDriver = (output: string): string | undefined => {
  // e.g. "Driver version: Intel iHD driver for Intel(R) Gen Graphics - 25.4.6 ()"
  const match = output.match(/Driver version:\s*(.+)/);
  return match ? match[1].replace(/\s*\(\)\s*$/, '').trim() : undefined;
};

const parseCodecs = (output: string): string[] =>
  codecLabels
    .filter(({ pattern }) => pattern.test(output))
    .map(({ label }) => label);
