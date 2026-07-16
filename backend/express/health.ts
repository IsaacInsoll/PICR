import type { RequestHandler } from 'express';
import { sql, type SQL } from 'drizzle-orm';
import { db } from '../db/picrDb.js';
import { log } from '../logger.js';

type ReadyDb = {
  execute: (query: SQL) => Promise<unknown>;
};

export const healthz: RequestHandler = (_req, res) => {
  res.status(200).json({ status: 'ok' });
};

export const createReadyz =
  (database: ReadyDb = db): RequestHandler =>
  async (_req, res) => {
    try {
      await database.execute(sql`select 1`);
      res.status(200).json({ status: 'ok' });
    } catch (e) {
      // Logged at debug so a genuinely-down database is diagnosable without
      // spamming the log every healthcheck interval while it stays down.
      log('debug', `readyz database check failed: ${String(e)}`);
      res.status(503).json({ status: 'unhealthy' });
    }
  };
