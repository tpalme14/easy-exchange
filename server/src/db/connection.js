import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

let db;

function resolveDatabasePath(databasePath) {
  if (databasePath === ':memory:' || path.isAbsolute(databasePath)) {
    return databasePath;
  }

  return path.resolve(env.projectRoot, databasePath);
}

export function createDatabase(databasePath = env.databasePath) {
  const resolvedPath = resolveDatabasePath(databasePath);

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const database = new DatabaseSync(resolvedPath, {
    enableForeignKeyConstraints: true
  });
  database.exec(fs.readFileSync(schemaPath, 'utf8'));
  return database;
}

export function initializeDatabase(databasePath = env.databasePath) {
  closeDb();
  db = createDatabase(databasePath);
  return db;
}

export function getDb() {
  if (!db) {
    db = createDatabase();
  }

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
