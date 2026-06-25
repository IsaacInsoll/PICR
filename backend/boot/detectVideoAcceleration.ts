import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { existsSync } from 'node:fs';
import { picrConfig } from '../config/picrConfig.js';
import { log } from '../logger.js';

// VAAPI capability probe run once at boot. It resolves picrConfig's video
// acceleration mode/driver/codecs so the benchmark and ServerInfo can report
// how video is being processed. It NEVER throws and NEVER exits the process:
// the worst case is falling back to CPU. Per-file CPU fallback at runtime still
// covers cases where a specific file/codec can't be accelerated.
//
// The authority for "is VAAPI usable" is a tiny ffmpeg VAAPI pipeline (proves
// PICR's ffmpeg can actually run scale_vaapi against the device), NOT vainfo.
// vainfo only enriches the display with the driver name + codec list.

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

  // Authority check: can ffmpeg actually run a VAAPI filter on this device?
  const ffmpegProbe = probeFfmpegVaapi(videoAccelerationDevice);
  if (ffmpegProbe.error || ffmpegProbe.status !== 0) {
    // Device present but ffmpeg VAAPI didn't work. Log loudly (warn) so a user
    // who mounted /dev/dri expecting acceleration can see why it didn't happen.
    useCpu('warn', `VAAPI probe failed: ${failureReason(ffmpegProbe)}`);
    return;
  }

  // ffmpeg VAAPI works. Enrich the display with driver + codecs via vainfo
  // (best effort — if vainfo is missing/fails we still report VAAPI active).
  const { driver, codecs } = vainfoCapabilities(videoAccelerationDevice);

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

// Minimal "does ffmpeg VAAPI work" smoke test. Mirrors the full thumbnail data
// path — hwupload -> scale_vaapi -> hwdownload -> sw frame — so a working probe
// proves the round-trip the thumbnails actually use (not just GPU-side scaling).
// Uses a synthetic source, so no input file or GPU decode is required.
const probeFfmpegVaapi = (device: string): SpawnSyncReturns<string> =>
  spawnSync(
    picrConfig.ffmpegPath ?? 'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-init_hw_device',
      `vaapi=va:${device}`,
      '-filter_hw_device',
      'va',
      '-f',
      'lavfi',
      '-i',
      'color=c=black:s=64x64:d=0.1',
      '-vf',
      'format=nv12,hwupload,scale_vaapi=w=32:h=32,hwdownload,format=nv12',
      '-frames:v',
      '1',
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8', timeout: probeTimeoutMs },
  );

const vainfoCapabilities = (
  device: string,
): { driver?: string; codecs: string[] } => {
  const info = spawnSync('vainfo', ['--display', 'drm', '--device', device], {
    encoding: 'utf8',
    timeout: probeTimeoutMs,
  });
  if (info.error || info.status !== 0) return { codecs: [] };
  return { driver: parseDriver(info.stdout), codecs: parseCodecs(info.stdout) };
};

const useCpu = (level: 'info' | 'warn', reason: string): void => {
  picrConfig.videoAccelerationMode = 'cpu';
  picrConfig.videoAccelerationDriver = undefined;
  picrConfig.videoAccelerationCodecs = undefined;
  picrConfig.videoAccelerationReason = reason;
  log(level, `🎬 Using CPU only for video processing because ${reason}`, true);
};

const failureReason = (probe: SpawnSyncReturns<string>): string => {
  if (probe.error) return probe.error.message;
  const output = (probe.stderr || probe.stdout || '').trim();
  const lastLine = output.split('\n').filter(Boolean).at(-1);
  return lastLine ?? `exited with status ${probe.status}`;
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
