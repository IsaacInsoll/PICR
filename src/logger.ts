import { config } from 'dotenv';

config(); // read .ENV

const enabled = process.env.DEBUG_SQL == 'true';
export const logger = (message: string) => {
  if (enabled) console.log(message);
};
