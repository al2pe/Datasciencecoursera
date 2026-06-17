import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'journal.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      account TEXT NOT NULL DEFAULT 'default',
      asset_type TEXT NOT NULL DEFAULT 'equity',
      symbol TEXT NOT NULL,
      side TEXT NOT NULL,
      order_type TEXT NOT NULL DEFAULT 'market',
      state TEXT NOT NULL DEFAULT 'filled',
      quantity REAL NOT NULL DEFAULT 0,
      average_price REAL,
      total_value REAL,
      fees REAL NOT NULL DEFAULT 0,
      placed_agent TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      executed_at TEXT,
      expiration_date TEXT,
      strike_price REAL,
      option_type TEXT,
      direction TEXT,
      premium REAL,
      ai_analysis TEXT,
      ai_tags TEXT,
      notes TEXT,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS positions (
      symbol TEXT PRIMARY KEY,
      quantity REAL NOT NULL DEFAULT 0,
      average_buy_price REAL NOT NULL DEFAULT 0,
      asset_type TEXT NOT NULL DEFAULT 'equity',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_at TEXT NOT NULL DEFAULT (datetime('now')),
      total_value REAL NOT NULL DEFAULT 0,
      equity_value REAL NOT NULL DEFAULT 0,
      options_value REAL NOT NULL DEFAULT 0,
      crypto_value REAL NOT NULL DEFAULT 0,
      cash REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
    CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_trades_asset_type ON trades(asset_type);
    CREATE INDEX IF NOT EXISTS idx_trades_placed_agent ON trades(placed_agent);
  `)
}
