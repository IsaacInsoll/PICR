import type { BigIntStats } from 'node:fs';

export interface PicrFileStats {
  size: number;
  mtime: Date;
  birthtime: Date;
  isDirectory(): boolean;
  isFile(): boolean;
}

export const fileStatsFromBigIntStats = (
  stats: BigIntStats,
): PicrFileStats => ({
  size: Number(stats.size),
  mtime: dateFromNanoseconds(stats.mtimeNs),
  birthtime: dateFromNanoseconds(stats.birthtimeNs),
  isDirectory: () => stats.isDirectory(),
  isFile: () => stats.isFile(),
});

const dateFromNanoseconds = (nanoseconds: bigint): Date => {
  const roundedMilliseconds = (nanoseconds + 500_000n) / 1_000_000n;
  return new Date(Number(roundedMilliseconds));
};
