import { randomBytes } from 'node:crypto';
import {
  PICR_PING_V1_MAX_DIRECTORIES,
  PICR_PING_V1_MAX_REQUEST_BYTES,
  PICR_PING_V1_PROTOCOL_VERSION,
} from '../../shared/ping/protocol.js';
import type { PingConfig } from './config.js';

export const PROTOCOL_VERSION = PICR_PING_V1_PROTOCOL_VERSION;
export const MAX_REQUEST_BYTES = PICR_PING_V1_MAX_REQUEST_BYTES;
export const MAX_DIRECTORIES = PICR_PING_V1_MAX_DIRECTORIES;

type ProtocolBase = {
  instanceId: string;
  instanceUptimeMs: number;
  protocolVersion: typeof PROTOCOL_VERSION;
  source: string;
  watcherReadyUptimeMs: number | null;
  watchPrefix: string;
};

export type ChangePayload = ProtocolBase & {
  directories: string[];
  reconcile: false;
};

export type ReconcilePayload = ProtocolBase & {
  directories: [];
  reconcile: true;
  reconcileMode: 'auto' | 'force';
  reconcilePath: string;
};

export type HeartbeatPayload = ProtocolBase & {
  directories: [];
  reconcile: false;
};

export type ProbePayload = ProtocolBase & {
  probePath: string;
};

export type PingPayload =
  ChangePayload | HeartbeatPayload | ProbePayload | ReconcilePayload;

export type ProtocolContext = {
  changePayload: (directories: string[]) => ChangePayload;
  heartbeatPayload: () => HeartbeatPayload;
  markWatcherReady: () => void;
  probePayload: (probePath: string) => ProbePayload;
  reconcilePayload: (
    reconcilePath: string,
    reconcileMode: 'auto' | 'force',
  ) => ReconcilePayload;
};

type ProtocolContextOptions = {
  config: PingConfig;
  instanceId?: string;
  uptimeMs?: () => number;
};

export const createProtocolContext = ({
  config,
  instanceId = randomBytes(16).toString('hex'),
  uptimeMs = () => Math.floor(process.uptime() * 1000),
}: ProtocolContextOptions): ProtocolContext => {
  let watcherReadyUptimeMs: number | null = null;

  const base = (): ProtocolBase => ({
    instanceId,
    instanceUptimeMs: uptimeMs(),
    protocolVersion: PROTOCOL_VERSION,
    source: config.pingName,
    // This is the process-uptime snapshot captured at ready, not wall-clock time.
    watcherReadyUptimeMs,
    watchPrefix: config.pathPrefix,
  });

  return {
    changePayload: (directories) => ({
      ...base(),
      directories,
      reconcile: false,
    }),
    heartbeatPayload: () => ({
      ...base(),
      directories: [],
      reconcile: false,
    }),
    markWatcherReady: () => {
      watcherReadyUptimeMs ??= uptimeMs();
    },
    probePayload: (probePath) => ({ ...base(), probePath }),
    reconcilePayload: (reconcilePath, reconcileMode) => ({
      ...base(),
      directories: [],
      reconcile: true,
      reconcileMode,
      reconcilePath,
    }),
  };
};

export const payloadBytes = (payload: PingPayload): number =>
  Buffer.byteLength(JSON.stringify(payload), 'utf8');
