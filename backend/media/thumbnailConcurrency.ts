import { picrConfig } from '../config/picrConfig.js';

// Every thumbnail decode acquires a slot here, whether it came from the file
// queue or from a request-time cache miss on /image/... . Without this the
// queue was bounded by `thumbnailWorkerCount` while HTTP requests were not, so
// a browser opening a cold folder could start one full-resolution decode per
// visible image and exhaust memory. `THUMBNAIL_WORKERS` only means what the
// documentation claims once both paths share this limiter.
export type ThumbnailPriority = 'interactive' | 'background';

// A viewer waiting on a visible thumbnail should not sit behind a whole-library
// warm-up, so interactive waiters jump the queue. Within a priority the order
// is FIFO.
const PRIORITY_ORDER: readonly ThumbnailPriority[] = [
  'interactive',
  'background',
];

// Purely a guard against a slot that is never released: a bug there would
// otherwise wedge every later request forever. Long enough that no legitimate
// queue reaches it, and a plain error because callers do not distinguish it
// from any other generation failure.
const SLOT_WAIT_SAFETY_MS = 5 * 60_000;

interface Waiter {
  resolve: (release: () => void) => void;
  reject: (error: Error) => void;
  timer?: NodeJS.Timeout;
  settled: boolean;
}

const waiting: Record<ThumbnailPriority, Waiter[]> = {
  interactive: [],
  background: [],
};

let active = 0;

// Read per acquisition rather than cached: configuration is resolved during
// boot, after this module is first imported.
const slotLimit = (): number =>
  Math.max(1, Math.floor(picrConfig.thumbnailWorkerCount || 1));

const takeNextWaiter = (): Waiter | undefined => {
  for (const priority of PRIORITY_ORDER) {
    const waiter = waiting[priority].shift();
    if (waiter) return waiter;
  }
  return undefined;
};

const releaseSlot = () => {
  active--;
  drain();
};

const makeRelease = (): (() => void) => {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseSlot();
  };
};

const drain = () => {
  while (active < slotLimit()) {
    const waiter = takeNextWaiter();
    if (!waiter) return;
    if (waiter.settled) continue;
    waiter.settled = true;
    if (waiter.timer) clearTimeout(waiter.timer);
    active++;
    waiter.resolve(makeRelease());
  }
};

const acquireSlot = (priority: ThumbnailPriority): Promise<() => void> => {
  if (active < slotLimit()) {
    active++;
    return Promise.resolve(makeRelease());
  }

  return new Promise<() => void>((resolve, reject) => {
    const waiter: Waiter = { resolve, reject, settled: false };

    waiter.timer = setTimeout(() => {
      if (waiter.settled) return;
      waiter.settled = true;
      const queue = waiting[priority];
      const index = queue.indexOf(waiter);
      if (index !== -1) queue.splice(index, 1);
      reject(
        new Error(
          `Gave up after ${SLOT_WAIT_SAFETY_MS}ms waiting for a thumbnail worker`,
        ),
      );
    }, SLOT_WAIT_SAFETY_MS);
    // A pending waiter must never hold the process open on shutdown.
    waiter.timer.unref();

    waiting[priority].push(waiter);
  });
};

// A request waits for the correct image rather than being told to come back.
// The queue is bounded and prioritised, so waiting resolves; a queue deep enough
// to outlast a reverse proxy's timeout means the server is genuinely overloaded,
// which is an operator problem rather than something to paper over per-request.
export const withThumbnailSlot = async <T>(
  priority: ThumbnailPriority,
  run: () => Promise<T>,
): Promise<T> => {
  const release = await acquireSlot(priority);
  try {
    return await run();
  } finally {
    release();
  }
};

export const thumbnailSlotStats = () => ({
  active,
  limit: slotLimit(),
  waiting: waiting.interactive.length + waiting.background.length,
});
