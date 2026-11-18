import type { Request, Response } from 'express';
import { picrConfig } from '../config/picrConfig.js';
import { logger } from '../logger.js';

// Express derives protocol/host using the server's trust-proxy policy. Reverse
// proxies must overwrite forwarding headers; BASE_URL remains an allowed alias.
export function effectiveRequestOrigin(
  req: Pick<Request, 'protocol' | 'host'>,
): string | undefined {
  try {
    return new URL(`${req.protocol}://${req.host}`).origin;
  } catch {
    return undefined;
  }
}

export function adminOriginAllowed(req: Request, res: Response): boolean {
  const origin = req.get('origin');
  const requestOrigin = effectiveRequestOrigin(req);
  if (
    !origin ||
    origin === requestOrigin ||
    origin === picrConfig.baseUrlOrigin
  )
    return true;
  logger.warn('Admin authentication Origin rejected', {
    origin: origin.slice(0, 256),
    requestOrigin,
    configuredOrigin: picrConfig.baseUrlOrigin,
  });
  res.status(403).json({ error: 'invalid_request' });
  return false;
}
