import { createHash, timingSafeEqual } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import { z } from 'zod';
import { isIgnoredPath } from '@shared/filesystem/ignoredPaths.js';
import {
  normalisePicrPingV1Path,
  PICR_PING_V1_MAX_DIRECTORIES,
  PICR_PING_V1_MAX_REQUEST_BYTES,
  PICR_PING_V1_PROTOCOL_VERSION,
  picrPingV1PathIsWithin,
} from '@shared/ping/protocol.js';
import { picrConfig } from '../config/picrConfig.js';
import { pingScanCoordinator } from '../filesystem/pingScanCoordinator.js';
import {
  completedReconcileWithinCooldown,
  getCoveringPingReconcile,
  observePingSource,
  PingSourceLimitError,
  PingSourcePrefixError,
  recordPingBatch,
  recordPingSourceError,
  recordSuccessfulPingReconcile,
} from '../filesystem/pingStatus.js';
import { getLastSuccessfulFullLibraryScan } from '../filesystem/scanCoverage.js';
import {
  isPingAuthBlocked,
  recordFailedPingAuth,
  recordSuccessfulPingAuth,
} from './pingAuthRateLimit.js';

export const PICR_PING_PROTOCOL_VERSION = PICR_PING_V1_PROTOCOL_VERSION;
export const PICR_PING_MAX_REQUEST_BYTES = PICR_PING_V1_MAX_REQUEST_BYTES;
export const PICR_PING_MAX_DIRECTORIES = PICR_PING_V1_MAX_DIRECTORIES;

const safeDisplayString = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((value) => [...value].length <= 64, `${label} is too long`)
    .refine((value) => !/\p{Cc}/u.test(value), `${label} is unsafe`);

const safePath = (label: string, maxLength: number) =>
  z.string().transform((value, context) => {
    try {
      return normalisePingPath(value, label, maxLength);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : String(error),
      });
      return z.NEVER;
    }
  });

const protocolBaseSchema = z
  .object({
    protocolVersion: z.number().int(),
    source: safeDisplayString('source'),
    instanceId: safeDisplayString('instanceId'),
    instanceUptimeMs: z.number().finite().nonnegative(),
    watcherReadyUptimeMs: z.number().finite().nonnegative().nullable(),
    watchPrefix: safePath('watchPrefix', 255),
  })
  .superRefine((value, context) => {
    if (
      value.watcherReadyUptimeMs !== null &&
      value.watcherReadyUptimeMs > value.instanceUptimeMs
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'watcherReadyUptimeMs cannot exceed instanceUptimeMs',
      });
    }
  });

const changeSchema = protocolBaseSchema.and(
  z.object({
    directories: z
      .array(safePath('directory', 255))
      .max(PICR_PING_MAX_DIRECTORIES),
    reconcile: z.literal(false),
  }),
);

const reconcileSchema = protocolBaseSchema.and(
  z.object({
    directories: z.tuple([]),
    reconcile: z.literal(true),
    reconcileMode: z.enum(['auto', 'force']),
    reconcilePath: safePath('reconcilePath', 255).optional(),
  }),
);

const probeSchema = protocolBaseSchema.and(
  z.object({ probePath: safePath('probePath', 511) }),
);

type ProtocolBase = z.infer<typeof protocolBaseSchema>;
type ChangeRequest = z.infer<typeof changeSchema>;
type ReconcileRequest = z.infer<typeof reconcileSchema>;
type ProbeRequest = z.infer<typeof probeSchema>;
type ValidPingRequest = ChangeRequest | ProbeRequest | ReconcileRequest;

interface PingCoordinatorApi {
  enqueueDirectories: (directories: string[]) => Promise<void>;
  enqueueReconcile: (
    reconcilePath: string,
    onComplete?: (coverage: { startedAt: Date; completedAt: Date }) => void,
  ) => Promise<void>;
}

interface MediaChangedDependencies {
  coordinator: PingCoordinatorApi;
  now: () => Date;
  probePath: (path: string) => Promise<'ignored' | 'missing' | 'visible'>;
}

export const authenticatePing: RequestHandler = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const expected = picrConfig.pingToken;
  const authorization = req.get('authorization');
  const supplied = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
  if (expected && safeTokenEqual(expected, supplied)) {
    recordSuccessfulPingAuth(ip);
    next();
    return;
  }

  if (isPingAuthBlocked(ip)) {
    res.setHeader('Retry-After', '900');
    res.status(429).json({ error: 'Too many authentication failures' });
    return;
  }

  recordFailedPingAuth(ip);
  res.status(401).json({
    error: 'PICR Ping authentication failed',
    code: 'PING_UNAUTHENTICATED',
  });
};

export const createMediaChangedHandler = (
  dependencies: Partial<MediaChangedDependencies> = {},
): RequestHandler => {
  const deps: MediaChangedDependencies = {
    coordinator: pingScanCoordinator,
    now: () => new Date(),
    probePath: probeVisiblePath,
    ...dependencies,
  };

  return async (req, res) => {
    const parsed = parsePingRequest(req.body);
    if (!parsed.success) {
      res.status(400).json(parsed.error);
      return;
    }

    const request = parsed.data;
    const receivedAt = deps.now();
    const pingVersion = req.get('x-picr-ping-version');
    if (
      !pingVersion ||
      [...pingVersion].length > 64 ||
      /\p{Cc}/u.test(pingVersion)
    ) {
      res.status(400).json(invalidPayload('Invalid X-Picr-Ping-Version'));
      return;
    }

    try {
      assertRequestScope(request);
      observePingSource({
        instanceId: request.instanceId,
        name: request.source,
        pingVersion,
        receivedAt,
        watchPrefix: request.watchPrefix,
      });

      if ('probePath' in request) {
        res
          .status(200)
          .json({ probe: await deps.probePath(request.probePath) });
        return;
      }

      if (request.reconcile) {
        const reconcilePath = request.reconcilePath ?? request.watchPrefix;
        if (
          request.reconcileMode === 'auto' &&
          shouldSkipAutoReconcile(request, reconcilePath, receivedAt)
        ) {
          res.status(202).json({ accepted: 0, ignored: 0 });
          return;
        }
        await deps.coordinator.enqueueReconcile(reconcilePath, (coverage) =>
          recordSuccessfulPingReconcile(
            request.source,
            reconcilePath,
            coverage,
          ),
        );
        res.status(202).json({ accepted: 0, ignored: 0 });
        return;
      }

      const ignored = request.directories.filter(isIgnoredPath);
      const accepted = request.directories.filter(
        (directory) => !isIgnoredPath(directory),
      );
      if (request.directories.length > 0) {
        recordPingBatch(request.source, accepted.length, receivedAt);
      }
      if (accepted.length > 0) {
        await deps.coordinator.enqueueDirectories([...new Set(accepted)]);
      }
      res
        .status(202)
        .json({ accepted: accepted.length, ignored: ignored.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      recordPingSourceError(request.source, message);
      if (
        error instanceof PingSourceLimitError ||
        error instanceof PingSourcePrefixError
      ) {
        res.status(400).json(invalidPayload(message));
        return;
      }
      res.status(500).json({ error: 'PICR Ping request failed' });
    }
  };
};

export const mediaChangedBodyError: ErrorRequestHandler = (
  error,
  _req,
  res,
  next,
) => {
  if (
    error instanceof SyntaxError ||
    (typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      error.type === 'entity.too.large')
  ) {
    res.status(400).json(invalidPayload('Malformed or oversized JSON body'));
    return;
  }
  next(error);
};

export const registerMediaChangedRoute = (router: express.Router): void => {
  if (!picrConfig.pingToken) return;
  router.post(
    '/api/media-changed',
    authenticatePing,
    express.json({ limit: PICR_PING_MAX_REQUEST_BYTES, strict: true }),
    createMediaChangedHandler(),
    mediaChangedBodyError,
  );
};

export const normalisePingPath = normalisePicrPingV1Path;

const parsePingRequest = (
  body: unknown,
):
  | { success: true; data: ValidPingRequest }
  | {
      success: false;
      error:
        | ReturnType<typeof invalidPayload>
        | {
            error: string;
            code: string;
            supportedProtocolVersions: number[];
          };
    } => {
  if (!body || typeof body !== 'object') {
    return { success: false, error: invalidPayload('Expected a JSON object') };
  }
  const version = (body as Record<string, unknown>)['protocolVersion'];
  if (version !== PICR_PING_PROTOCOL_VERSION) {
    return {
      success: false,
      error: {
        error: 'Unsupported PICR Ping protocol version',
        code: 'UNSUPPORTED_PROTOCOL_VERSION',
        supportedProtocolVersions: [PICR_PING_PROTOCOL_VERSION],
      },
    };
  }

  const record = body as Record<string, unknown>;
  if (
    'probePath' in record &&
    ['directories', 'reconcile', 'reconcileMode', 'reconcilePath'].some(
      (key) => key in record,
    )
  ) {
    return {
      success: false,
      error: invalidPayload('A probe accepts exactly one probePath'),
    };
  }
  const schema =
    'probePath' in record
      ? probeSchema
      : record['reconcile'] === true
        ? reconcileSchema
        : changeSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      success: false,
      error: invalidPayload(parsed.error.issues.map((issue) => issue.message)),
    };
  }
  return { success: true, data: parsed.data };
};

const invalidPayload = (details: string | string[]) => ({
  error: 'Invalid PICR Ping payload',
  code: 'INVALID_PAYLOAD',
  details: Array.isArray(details) ? details : [details],
});

const assertRequestScope = (request: ValidPingRequest): void => {
  const paths =
    'probePath' in request
      ? [request.probePath]
      : request.reconcile
        ? [request.reconcilePath ?? request.watchPrefix]
        : request.directories;
  if (
    paths.some((path) => !picrPingV1PathIsWithin(path, request.watchPrefix))
  ) {
    throw new PingSourcePrefixError(
      'PICR Ping request contains a path outside watchPrefix',
    );
  }
};

const shouldSkipAutoReconcile = (
  request: ReconcileRequest,
  reconcilePath: string,
  receivedAt: Date,
): boolean => {
  if (
    completedReconcileWithinCooldown(request.source, reconcilePath, receivedAt)
  ) {
    return true;
  }
  const readyBoundary = watcherReadyBoundary(request, receivedAt);
  const fullScan = getLastSuccessfulFullLibraryScan();
  if (fullScan && fullScan.startedAt >= readyBoundary) return true;
  const reconcile = getCoveringPingReconcile(request.source, reconcilePath);
  return Boolean(reconcile && reconcile.startedAt >= readyBoundary);
};

const watcherReadyBoundary = (
  request: ProtocolBase,
  receivedAt: Date,
): Date => {
  if (request.watcherReadyUptimeMs === null) return receivedAt;
  return new Date(
    receivedAt.getTime() -
      request.instanceUptimeMs +
      request.watcherReadyUptimeMs,
  );
};

const probeVisiblePath = async (
  relativePath: string,
): Promise<'ignored' | 'missing' | 'visible'> => {
  if (isIgnoredPath(relativePath)) return 'ignored';
  const mediaRoot = resolve(picrConfig.mediaPath);
  const candidate = resolve(mediaRoot, ...relativePath.split('/'));
  if (candidate !== mediaRoot && !candidate.startsWith(`${mediaRoot}${sep}`)) {
    return 'missing';
  }
  try {
    await stat(candidate);
    return 'visible';
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return 'missing';
    }
    throw error;
  }
};

const safeTokenEqual = (expected: string, supplied: string): boolean => {
  const expectedHash = createHash('sha256').update(expected).digest();
  const suppliedHash = createHash('sha256').update(supplied).digest();
  return timingSafeEqual(expectedHash, suppliedHash);
};
