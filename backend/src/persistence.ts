import Database from 'better-sqlite3';
import path from 'path';

export const db = new Database(path.join(process.cwd(), 'assistant.db'));

export function initializeDatabase(): void {
  db.prepare(`CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    source TEXT,
    status TEXT NOT NULL,
    transcript TEXT,
    classification TEXT
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload_json TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY(call_id) REFERENCES calls(id)
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    title TEXT NOT NULL,
    remind_at_iso TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(call_id) REFERENCES calls(id)
  )`).run();

  db.prepare(`CREATE TABLE IF NOT EXISTS calendar (
    id TEXT PRIMARY KEY,
    call_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start_iso TEXT NOT NULL,
    end_iso TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY(call_id) REFERENCES calls(id)
  )`).run();
}


