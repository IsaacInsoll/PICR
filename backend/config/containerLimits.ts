import { existsSync, readFileSync } from 'node:fs';
import { availableParallelism, totalmem } from 'node:os';

// `os.totalmem()` and `os.availableParallelism()` report the *host* machine
// inside a container, not the cgroup the process is actually confined to. Any
// sizing decision made from them is wrong on a memory- or CPU-limited
// container, so read the cgroup first and only fall back to the host values.
const CGROUP_V2_MEMORY_MAX = '/sys/fs/cgroup/memory.max';
const CGROUP_V1_MEMORY_MAX = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
const CGROUP_V2_CPU_MAX = '/sys/fs/cgroup/cpu.max';
const CGROUP_V1_CPU_QUOTA = '/sys/fs/cgroup/cpu/cpu.cfs_quota_us';
const CGROUP_V1_CPU_PERIOD = '/sys/fs/cgroup/cpu/cpu.cfs_period_us';

// An unlimited cgroup reports the literal `max` on v2, and a sentinel close to
// the 64-bit page-counter maximum on v1. A "limit" at or above the host's own
// RAM is not a real limit either, so all three cases resolve to undefined.
export const parseCgroupMemoryLimit = (
  raw: string,
  hostTotalBytes: number,
): number | undefined => {
  const value = raw.trim();
  if (value === '' || value === 'max') return undefined;
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes <= 0) return undefined;
  if (bytes >= hostTotalBytes) return undefined;
  return bytes;
};

// cgroup v2 publishes `<quota> <period>`, using `max` for the quota when the
// controller is uncapped.
export const parseCgroupCpuMax = (raw: string): number | undefined => {
  const [quota, period] = raw.trim().split(/\s+/);
  if (!quota || quota === 'max') return undefined;
  return cpuCountFromQuota(Number(quota), Number(period));
};

// cgroup v1 splits the same information across two files and uses -1 for
// "uncapped".
export const parseCgroupCpuQuota = (
  rawQuota: string,
  rawPeriod: string,
): number | undefined =>
  cpuCountFromQuota(Number(rawQuota.trim()), Number(rawPeriod.trim()));

// Rounded rather than floored so a 1.5-CPU container is still allowed the
// parallelism its half core represents; never below one.
const cpuCountFromQuota = (
  quota: number,
  period: number,
): number | undefined => {
  if (!Number.isFinite(quota) || quota <= 0) return undefined;
  if (!Number.isFinite(period) || period <= 0) return undefined;
  return Math.max(1, Math.round(quota / period));
};

const readCgroupFile = (path: string): string | undefined => {
  try {
    if (!existsSync(path)) return undefined;
    return readFileSync(path, 'utf8');
  } catch {
    // An unreadable cgroup file is not an error worth surfacing; the host
    // fallback is always a usable answer.
    return undefined;
  }
};

export const containerMemoryLimitBytes = (
  hostTotalBytes: number = totalmem(),
): number | undefined => {
  for (const path of [CGROUP_V2_MEMORY_MAX, CGROUP_V1_MEMORY_MAX]) {
    const raw = readCgroupFile(path);
    if (raw === undefined) continue;
    const limit = parseCgroupMemoryLimit(raw, hostTotalBytes);
    if (limit !== undefined) return limit;
  }
  return undefined;
};

export const containerCpuLimit = (): number | undefined => {
  const v2 = readCgroupFile(CGROUP_V2_CPU_MAX);
  if (v2 !== undefined) {
    const limit = parseCgroupCpuMax(v2);
    if (limit !== undefined) return limit;
  }

  const quota = readCgroupFile(CGROUP_V1_CPU_QUOTA);
  const period = readCgroupFile(CGROUP_V1_CPU_PERIOD);
  if (quota !== undefined && period !== undefined) {
    return parseCgroupCpuQuota(quota, period);
  }

  return undefined;
};

export const availableMemoryBytes = (): number =>
  containerMemoryLimitBytes() ?? totalmem();

export const availableCpuCount = (): number =>
  containerCpuLimit() ?? availableParallelism();
