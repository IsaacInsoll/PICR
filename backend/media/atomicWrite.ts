import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';

export const atomicWrite = async <T>(
  targetPath: string,
  writer: (tempPath: string) => Promise<T>,
): Promise<T> => {
  const targetDir = dirname(targetPath);
  await mkdir(targetDir, { recursive: true });
  const extension = extname(targetPath);
  const tempPath = join(
    targetDir,
    `.${basename(targetPath, extension)}.${process.pid}.${randomUUID()}${extension || '.tmp'}`,
  );

  try {
    const result = await writer(tempPath);
    await rename(tempPath, targetPath);
    return result;
  } catch (error) {
    await rm(tempPath, { force: true, recursive: true });
    throw error;
  }
};
