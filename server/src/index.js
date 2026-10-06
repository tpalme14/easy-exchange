import { env } from './config/env.js';
import app from './app.js';
import { initializeDatabase } from './db/connection.js';

initializeDatabase();

app.listen(env.port, () => {
  console.log(`Easy Exchange API listening on port ${env.port}`);
});
