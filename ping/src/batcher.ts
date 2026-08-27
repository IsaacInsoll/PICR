export type TimerHandle = ReturnType<typeof setTimeout>;

export type BatchScheduler = {
  clearTimeout: (handle: TimerHandle) => void;
  setTimeout: (callback: () => void, delayMs: number) => TimerHandle;
};

const defaultScheduler: BatchScheduler = {
  clearTimeout: (handle) => clearTimeout(handle),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
};

export type DirectoryBatcher = {
  add: (directories: readonly string[], delayMs?: number) => void;
  close: () => Promise<{ heldDirectories: string[] }>;
  flush: () => Promise<void>;
  pendingCount: () => number;
};

type DirectoryBatcherOptions = {
  batchMs: number;
  maxBytes?: number;
  maxDirectories: number;
  measureBytes?: (directories: string[]) => number;
  onFlush: (directories: string[]) => Promise<void> | void;
  scheduler?: BatchScheduler;
};

export const createDirectoryBatcher = ({
  batchMs,
  maxBytes,
  maxDirectories,
  measureBytes,
  onFlush,
  scheduler = defaultScheduler,
}: DirectoryBatcherOptions): DirectoryBatcher => {
  const ready = new Set<string>();
  const held = new Map<string, TimerHandle>();
  let flushTimer: TimerHandle | undefined;
  let flushChain = Promise.resolve();
  let closed = false;

  const cancelFlushTimer = () => {
    if (!flushTimer) return;
    scheduler.clearTimeout(flushTimer);
    flushTimer = undefined;
  };

  const flush = async () => {
    cancelFlushTimer();
    if (ready.size === 0) return flushChain;
    const directories = [...ready];
    ready.clear();
    flushChain = flushChain.then(() => onFlush(directories));
    await flushChain;
  };

  const scheduleFlush = () => {
    if (flushTimer || closed || ready.size === 0) return;
    flushTimer = scheduler.setTimeout(() => {
      flushTimer = undefined;
      void flush();
    }, batchMs);
  };

  const makeReady = (directory: string) => {
    held.delete(directory);
    ready.add(directory);
    if (
      maxBytes !== undefined &&
      measureBytes &&
      ready.size > 1 &&
      measureBytes([...ready]) > maxBytes
    ) {
      ready.delete(directory);
      // flush snapshots and clears `ready` before its first await. Keep that
      // synchronous boundary if flush is refactored: this item belongs to the
      // next request, not the oversized request being sent now.
      void flush();
      ready.add(directory);
    }
    if (ready.size >= maxDirectories) {
      void flush();
    } else {
      scheduleFlush();
    }
  };

  const add = (directories: readonly string[], delayMs = 0) => {
    if (closed) return;
    directories.forEach((directory) => {
      if (ready.has(directory)) return;
      const existingHold = held.get(directory);
      if (delayMs <= 0) {
        if (existingHold) scheduler.clearTimeout(existingHold);
        makeReady(directory);
        return;
      }
      if (existingHold) return;
      held.set(
        directory,
        scheduler.setTimeout(() => makeReady(directory), delayMs),
      );
    });
  };

  const close = async () => {
    closed = true;
    cancelFlushTimer();
    const heldDirectories = [...held.keys()];
    held.forEach((handle) => scheduler.clearTimeout(handle));
    held.clear();
    await flush();
    return { heldDirectories };
  };

  return {
    add,
    close,
    flush,
    pendingCount: () => ready.size + held.size,
  };
};
