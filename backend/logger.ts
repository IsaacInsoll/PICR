import { picrConfig } from './server';

export const logger = (message: string, important?: boolean) => {
  if (picrConfig?.verbose || important) console.log(message);
};
