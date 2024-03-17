import { config } from 'dotenv';

config(); // read .ENV

const enabled = process.env.VERBOSE == 'true';
export const logger = (message: string, important?: boolean) => {
  if (enabled || important) console.log(message);
};
