import { spawn } from 'node:child_process';
import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';

export const folderSize = async (targetPath: string): Promise<number> => {
  const duSize = await folderSizeFromDu(targetPath);
  if (duSize !== null) return duSize;
  return folderSizeFromFilesystem(targetPath);
};

const duArgs = (targetPath: string): string[] | null => {
  if (process.platform === 'linux') return ['-sb', targetPath];
  if (process.platform === 'darwin') return ['-sk', targetPath];
  return null;
};

const folderSizeFromDu = (targetPath: string): Promise<number | null> => {
  const args = duArgs(targetPath);
  if (!args) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const child = spawn('du', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        resolve(null);
        return;
      }
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Could not calculate folder size for ${targetPath}: ${stderr.trim()}`,
          ),
        );
        return;
      }

      const match = /^(\d+)/.exec(stdout);
      if (!match) {
        reject(
          new Error(
            `Could not parse folder size for ${targetPath}: ${stdout.trim()}`,
          ),
        );
        return;
      }

      const bytes = Number(match[1]);
      resolve(process.platform === 'darwin' ? bytes * 1024 : bytes);
    });
  });
};

export const folderSizeFromFilesystem = async (
  targetPath: string,
): Promise<number> => {
  const stats = await lstat(targetPath);
  if (!stats.isDirectory()) return stats.size;

  let total = 0;
  const entries = await readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    total += await folderSizeFromFilesystem(path.join(targetPath, entry.name));
  }
  return total;
};
