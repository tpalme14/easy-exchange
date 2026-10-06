import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

dotenv.config({ path: path.join(projectRoot, '.env') });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3001,
  databasePath: process.env.DATABASE_PATH || './server/data/easy-exchange.db',
  sessionSecret: process.env.SESSION_SECRET || '',
  projectRoot
};
