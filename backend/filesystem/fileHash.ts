import crypto from 'crypto';
import fs from 'fs';
import { sep } from 'path';
import { FileFields } from '../db/picrDb';

export const fileHash = (filePath: string): string => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
};

export const fileHash2 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// hashing file contents takes too long, especially on larger files, and isn't really needed so lets do a fast alternative
export const fastHash = (file: FileFields, stats: fs.Stats): string => {
  const hashSum = crypto.createHash('sha256');
  hashSum.update(
    file.relativePath +
      sep +
      file.name +
      stats.mtime.toString() +
      stats.ctime.toString(),
  );
  return hashSum.digest('hex');
};
