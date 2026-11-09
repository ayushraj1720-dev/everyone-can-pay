
const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// Create data folder if it does not exist
const dataDirectory = path.join(__dirname, 'data')

if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true })
}

// Connect to SQLite database
const db = new Database(
  path.join(dataDirectory, 'everyone-can-pay.db')
)

// Enable safer database operations
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Store each test run
db.exec(`
  CREATE TABLE IF NOT EXISTS test_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    total_tests INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    failed INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    product TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount TEXT,
    status TEXT NOT NULL,
    order_id TEXT,
    message TEXT,
    issue TEXT,
    description TEXT,
    debug_id TEXT,
    ai_analysis TEXT,
    decision TEXT DEFAULT 'Pending',
    FOREIGN KEY (run_id)
      REFERENCES test_runs(id)
      ON DELETE CASCADE
  );
`)

console.log('SQLite database connected successfully')

module.exports = db
