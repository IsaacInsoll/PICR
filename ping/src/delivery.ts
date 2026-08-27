import type { PingConfig } from './config.js';
import type { PingLogger } from './logger.js';
import {
  MAX_DIRECTORIES,
  MAX_REQUEST_BYTES,
  payloadBytes,
  type PingPayload,
  type ProtocolContext,
} from './protocol.js';

const MAX_DIRECTORY_ATTEMPTS = 5;
const BASE_RETRY_MS = 1000;
const MAX_RETRY_MS = 60_000;
const REQUEST_TIMEOUT_MS = 10_000;

type SendResult =
  | { kind: 'permanent'; message: string }
  | { kind: 'success'; body?: unknown }
  | { kind: 'transient'; message: string; retryAfterMs?: number };

type ReconcileMarker = {
  mode: 'auto' | 'force';
  path: string;
};

type DeliveryOptions = {
  config: PingConfig;
  fetchImpl?: typeof fetch;
  logger: PingLogger;
  onPermanentError: (message: string) => void;
  protocol: ProtocolContext;
  random?: () => number;
};

export type DeliveryService = {
  enqueueDirectories: (directories: readonly string[]) => void;
  heartbeat: () => Promise<void>;
  probe: (
    path: string,
  ) => Promise<'ignored' | 'missing' | 'unavailable' | 'visible'>;
  requestReconcile: (path: string, mode: 'auto' | 'force') => void;
  shutdown: () => Promise<void>;
};

const retryAfterMs = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return undefined;
  return Math.max(0, date - Date.now());
};

const responseMessage = async (response: Response) => {
  const body = await response.text();
  return body
    ? `PICR returned ${response.status}: ${body.slice(0, 500)}`
    : `PICR returned ${response.status}`;
};

export const sendPayload = async (
  config: PingConfig,
  payload: PingPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> => {
  if (!config.picrUrl || !config.pingToken) {
    return { kind: 'permanent', message: 'PICR delivery is not configured' };
  }
  const endpoint = new URL('api/media-changed', config.picrUrl);
  try {
    const response = await fetchImpl(endpoint, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${config.pingToken}`,
        'Content-Type': 'application/json',
        'X-Picr-Ping-Version': config.version,
      },
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.ok) {
      const text = await response.text();
      if (!text) return { kind: 'success' };
      try {
        return { kind: 'success', body: JSON.parse(text) as unknown };
      } catch {
        return { kind: 'success', body: text };
      }
    }
    const message = await responseMessage(response);
    if (
      response.status === 408 ||
      response.status === 429 ||
      response.status >= 500
    ) {
      return {
        kind: 'transient',
        message,
        retryAfterMs:
          response.status === 429
            ? retryAfterMs(response.headers.get('Retry-After'))
            : undefined,
      };
    }
    return { kind: 'permanent', message };
  } catch (error) {
    return {
      kind: 'transient',
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

export const commonAncestor = (
  paths: readonly string[],
  floor: string,
): string => {
  if (paths.length === 0) return floor;
  const pathSegments = paths.map((path) => (path ? path.split('/') : []));
  const floorSegments = floor ? floor.split('/') : [];
  const shortest = Math.min(...pathSegments.map((segments) => segments.length));
  let commonLength = 0;
  while (
    commonLength < shortest &&
    pathSegments.every(
      (segments) => segments[commonLength] === pathSegments[0]?.[commonLength],
    )
  ) {
    commonLength += 1;
  }
  return (
    pathSegments[0]
      ?.slice(0, Math.max(commonLength, floorSegments.length))
      .join('/') ?? floor
  );
};

const isProbeResult = (
  value: unknown,
): value is { probe: 'ignored' | 'missing' | 'visible' } => {
  if (!value || typeof value !== 'object' || !('probe' in value)) return false;
  const probe = value.probe;
  return probe === 'ignored' || probe === 'missing' || probe === 'visible';
};

export const createDeliveryService = ({
  config,
  fetchImpl = fetch,
  logger,
  onPermanentError,
  protocol,
  random = Math.random,
}: DeliveryOptions): DeliveryService => {
  const pendingDirectories = new Set<string>();
  let reconcileMarker: ReconcileMarker | undefined;
  let processing = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let directoryAttempts = 0;
  let reconcileAttempts = 0;
  let stopped = false;
  let shutdownRequested = false;
  let permanentFailure = false;
  let activeRequest: Promise<void> | undefined;

  const retryDelay = (attempt: number, requested?: number) => {
    if (requested !== undefined) return requested;
    const exponential = Math.min(
      BASE_RETRY_MS * 2 ** Math.max(0, attempt - 1),
      MAX_RETRY_MS,
    );
    return Math.round(exponential * (0.8 + random() * 0.4));
  };

  const mergeReconcile = (path: string, mode: 'auto' | 'force') => {
    const absorbedDirectoryHints = pendingDirectories.size > 0;
    const paths = [path, ...pendingDirectories];
    if (reconcileMarker) paths.push(reconcileMarker.path);
    pendingDirectories.clear();
    reconcileMarker = {
      mode:
        mode === 'force' ||
        reconcileMarker?.mode === 'force' ||
        absorbedDirectoryHints
          ? 'force'
          : 'auto',
      path: commonAncestor(paths, config.pathPrefix),
    };
  };

  const collapsePendingIfNeeded = () => {
    if (
      pendingDirectories.size <= MAX_DIRECTORIES &&
      payloadBytes(protocol.changePayload([...pendingDirectories])) <=
        MAX_REQUEST_BYTES
    ) {
      return false;
    }
    mergeReconcile(
      commonAncestor([...pendingDirectories], config.pathPrefix),
      'force',
    );
    return true;
  };

  const schedule = (delayMs: number) => {
    if (retryTimer || stopped || shutdownRequested || permanentFailure) return;
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      kick();
    }, delayMs);
  };

  const failPermanently = (message: string) => {
    permanentFailure = true;
    onPermanentError(message);
    logger.log('error', message);
  };

  const processNext = async () => {
    if (processing || stopped || permanentFailure || retryTimer) return;
    const marker = reconcileMarker;
    let payload: PingPayload;
    let directories: string[] = [];
    if (marker) {
      reconcileMarker = undefined;
      payload = protocol.reconcilePayload(marker.path, marker.mode);
    } else if (pendingDirectories.size > 0) {
      directories = [...pendingDirectories];
      pendingDirectories.clear();
      payload = protocol.changePayload(directories);
    } else {
      return;
    }

    processing = true;
    const result = await sendPayload(config, payload, fetchImpl);
    processing = false;

    if (result.kind === 'success') {
      if ('reconcile' in payload && payload.reconcile) reconcileAttempts = 0;
      else directoryAttempts = 0;
      logger.log(
        'info',
        'reconcile' in payload && payload.reconcile
          ? `Reconcile accepted for ${payload.reconcilePath || '<media root>'}`
          : `Delivered ${directories.length} director${directories.length === 1 ? 'y' : 'ies'}`,
      );
      return;
    }

    if (result.kind === 'permanent') {
      failPermanently(result.message);
      return;
    }

    if ('reconcile' in payload && payload.reconcile) {
      reconcileAttempts += 1;
      mergeReconcile(payload.reconcilePath, payload.reconcileMode);
      const delayMs = retryDelay(reconcileAttempts, result.retryAfterMs);
      logger.log(
        'warn',
        `Reconcile delivery failed; retrying in ${delayMs}ms: ${result.message}`,
      );
      schedule(delayMs);
      return;
    }

    directoryAttempts += 1;
    directories.forEach((directory) => pendingDirectories.add(directory));
    if (collapsePendingIfNeeded()) {
      directoryAttempts = 0;
    } else if (directoryAttempts >= MAX_DIRECTORY_ATTEMPTS) {
      const reconcilePath = commonAncestor(
        [...pendingDirectories],
        config.pathPrefix,
      );
      directoryAttempts = 0;
      mergeReconcile(reconcilePath, 'force');
    }
    const delayMs = retryDelay(directoryAttempts || 1, result.retryAfterMs);
    logger.log(
      'warn',
      `Directory delivery failed; retrying in ${delayMs}ms: ${result.message}`,
    );
    schedule(delayMs);
  };

  const kick = () => {
    if (processing || stopped || permanentFailure || retryTimer) return;
    activeRequest = processNext().finally(() => {
      activeRequest = undefined;
      if (
        !shutdownRequested &&
        (pendingDirectories.size > 0 || reconcileMarker)
      ) {
        kick();
      }
    });
  };

  const enqueueDirectories = (directories: readonly string[]) => {
    if (stopped || shutdownRequested || permanentFailure) return;
    if (reconcileMarker) {
      // The precise hints are discarded into the pending marker, so it must
      // become forced: an auto reconcile could be skipped server-side after
      // those hints were already removed. Widening keeps one bounded retry
      // marker while ensuring it covers every absorbed directory.
      mergeReconcile(commonAncestor(directories, config.pathPrefix), 'force');
    } else {
      directories.forEach((directory) => pendingDirectories.add(directory));
      collapsePendingIfNeeded();
    }
    kick();
  };

  const requestReconcile = (path: string, mode: 'auto' | 'force') => {
    if (stopped || shutdownRequested || permanentFailure) return;
    mergeReconcile(path, mode);
    kick();
  };

  const sendOneOff = async (payload: PingPayload) => {
    if (stopped || shutdownRequested || permanentFailure) return undefined;
    const result = await sendPayload(config, payload, fetchImpl);
    if (result.kind === 'permanent') failPermanently(result.message);
    else if (result.kind === 'transient') {
      logger.log('warn', `PICR request failed: ${result.message}`);
    }
    return result;
  };

  return {
    enqueueDirectories,
    heartbeat: async () => {
      if (
        processing ||
        retryTimer ||
        pendingDirectories.size ||
        reconcileMarker
      ) {
        return;
      }
      await sendOneOff(protocol.heartbeatPayload());
    },
    probe: async (path) => {
      const result = await sendOneOff(protocol.probePayload(path));
      if (result?.kind !== 'success' || !isProbeResult(result.body)) {
        return 'unavailable';
      }
      return result.body.probe;
    },
    requestReconcile,
    shutdown: async () => {
      shutdownRequested = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }
      if (activeRequest) await activeRequest;
      if (pendingDirectories.size > 0 || reconcileMarker) await processNext();
      stopped = true;
    },
  };
};
