import { expect, test } from 'vitest';
import {
  parseCgroupCpuMax,
  parseCgroupCpuQuota,
  parseCgroupMemoryLimit,
} from '../../backend/config/containerLimits';
import { thumbnailWorkerCountFor } from '../../backend/config/configFromEnv';

const GB = 1024 * 1024 * 1024;

test('cgroup v2 reports an unlimited memory controller as "max"', () => {
  expect(parseCgroupMemoryLimit('max\n', 64 * GB)).toBeUndefined();
});

test('a real cgroup memory limit is used in preference to host RAM', () => {
  expect(parseCgroupMemoryLimit(String(GB), 64 * GB)).toBe(GB);
});

test('a cgroup limit at or above host RAM is not a real limit', () => {
  expect(parseCgroupMemoryLimit(String(64 * GB), 64 * GB)).toBeUndefined();
  // cgroup v1 reports a page-counter sentinel rather than a keyword
  expect(
    parseCgroupMemoryLimit('9223372036854771712', 64 * GB),
  ).toBeUndefined();
});

test('unparseable cgroup memory values fall back to the host', () => {
  expect(parseCgroupMemoryLimit('', 64 * GB)).toBeUndefined();
  expect(parseCgroupMemoryLimit('not-a-number', 64 * GB)).toBeUndefined();
  expect(parseCgroupMemoryLimit('-1', 64 * GB)).toBeUndefined();
});

test('cgroup v2 cpu.max converts quota and period to a cpu count', () => {
  expect(parseCgroupCpuMax('200000 100000')).toBe(2);
  expect(parseCgroupCpuMax('50000 100000')).toBe(1); // never below one
  expect(parseCgroupCpuMax('150000 100000')).toBe(2); // half cores round up
});

test('cgroup v2 reports an uncapped cpu controller as "max"', () => {
  expect(parseCgroupCpuMax('max 100000')).toBeUndefined();
});

test('cgroup v1 uses -1 for an uncapped cpu quota', () => {
  expect(parseCgroupCpuQuota('-1', '100000')).toBeUndefined();
  expect(parseCgroupCpuQuota('400000', '100000')).toBe(4);
});

test('worker count is bounded by cpu, memory budget, and the hard cap', () => {
  // The regression this guards: host values on a memory-limited container
  expect(thumbnailWorkerCountFor(16, 64 * GB)).toBe(8); // hard cap
  expect(thumbnailWorkerCountFor(2, 64 * GB)).toBe(2); // cpu bound
  expect(thumbnailWorkerCountFor(16, GB)).toBe(2); // memory bound
  expect(thumbnailWorkerCountFor(16, 256 * 1024 * 1024)).toBe(1); // never zero
});
