import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs, { type Database as SqlDatabase } from 'sql.js';

export type RouteRecord = {
  messageId: string; originalMessage: string; groupId: string; neighborhood: string;
  receivedAt: string; recipient: string; status: 'simulation' | 'sent' | 'failed' | 'ignored'; error?: string;
};

const SQL = await initSqlJs({
  locateFile: (file) => fileURLToPath(new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url))
});

export class RouteDatabase {
  readonly db: SqlDatabase;
  private readonly filename: string;
  constructor(filename = process.env.DATABASE_PATH ?? './data/routes.sqlite') {
    this.filename = filename;
    const existing = filename !== ':memory:' && fs.existsSync(filename) ? new Uint8Array(fs.readFileSync(filename)) : undefined;
    this.db = existing ? new SQL.Database(existing) : new SQL.Database();
    this.db.run(`CREATE TABLE IF NOT EXISTS routes (
      message_id TEXT PRIMARY KEY, original_message TEXT NOT NULL, group_id TEXT NOT NULL,
      neighborhood TEXT NOT NULL, received_at TEXT NOT NULL, recipient TEXT NOT NULL,
      status TEXT NOT NULL, error TEXT
    );`);
  }
  private persist(): void {
    if (this.filename === ':memory:') return;
    fs.mkdirSync(path.dirname(path.resolve(this.filename)), { recursive: true });
    fs.writeFileSync(this.filename, Buffer.from(this.db.export()));
  }
  has(messageId: string): boolean {
    const result = this.db.exec('SELECT 1 FROM routes WHERE message_id = $id LIMIT 1', { $id: messageId });
    return result.length > 0 && result[0].values.length > 0;
  }
  insert(record: RouteRecord): void {
    this.db.run(`INSERT INTO routes (message_id, original_message, group_id, neighborhood, received_at, recipient, status, error)
      VALUES ($messageId,$originalMessage,$groupId,$neighborhood,$receivedAt,$recipient,$status,$error)`, {
      $messageId: record.messageId, $originalMessage: record.originalMessage, $groupId: record.groupId,
      $neighborhood: record.neighborhood, $receivedAt: record.receivedAt, $recipient: record.recipient,
      $status: record.status, $error: record.error ?? null
    });
    this.persist();
  }
  updateStatus(messageId: string, status: RouteRecord['status'], error?: string): void {
    this.db.run('UPDATE routes SET status = $status, error = $error WHERE message_id = $id', { $status: status, $error: error ?? null, $id: messageId });
    this.persist();
  }
  list(limit = 100): RouteRecord[] {
    const result = this.db.exec('SELECT message_id, original_message, group_id, neighborhood, received_at, recipient, status, error FROM routes ORDER BY received_at DESC LIMIT $limit', { $limit: limit });
    if (!result.length) return [];
    return result[0].values.map(([messageId, originalMessage, groupId, neighborhood, receivedAt, recipient, status, error]) => ({ messageId, originalMessage, groupId, neighborhood, receivedAt, recipient, status, error: error ?? undefined } as RouteRecord));
  }
}
