import { db } from '@/db/client';
import * as fs from 'fs';
import * as path from 'path';

const MIGRATIONS_DIR = path.join(process.cwd(), 'src/db/migrations');

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s + ';');
}

export async function runMigrations(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const executed = await db.execute({
      sql: 'SELECT id FROM _migrations WHERE name = ?',
      args: [file],
    });

    if (executed.rows.length > 0) {
      console.log(`[migrate] Skipping already executed: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const statements = splitStatements(sql);

    for (const stmt of statements) {
      try {
        await db.execute(stmt);
      } catch (err) {
        console.warn(`[migrate] Warning (non-fatal) in ${file}:`, String(err));
      }
    }

    await db.execute({
      sql: 'INSERT INTO _migrations (name) VALUES (?)',
      args: [file],
    });
    console.log(`[migrate] Executed: ${file}`);
  }
}
