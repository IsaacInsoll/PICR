import path from 'node:path';
import { existsSync } from 'node:fs';

export const resolvePublicDir = () => {
  const distPublic = path.resolve(process.cwd(), 'dist', 'public');
  if (existsSync(distPublic)) return distPublic;
  return path.resolve(process.cwd(), 'public');
};
