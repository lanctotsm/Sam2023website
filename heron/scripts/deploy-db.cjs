nvm /**
 * Deploy-time DB setup: run migrations then seed base data.
 * Usage: CMS_DB_PATH=... BASE_ADMIN_EMAIL=... node scripts/deploy-db.cjs
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.CMS_DB_PATH || path.join(process.cwd(), "data", "cms.db");
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
console.log("DB path:", dbPath);

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --- Migrations ---
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const migrationsFolder = path.join(process.cwd(), "drizzle");
if (fs.existsSync(migrationsFolder)) {
  const applied = new Set(
    db.prepare("SELECT id FROM _migrations").all().map((r) => r.id)
  );
  const files = fs.readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql")).sort();
  const insert = db.prepare("INSERT INTO _migrations (id) VALUES (?)");

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    console.log("Applying migration:", file);
    const sql = fs.readFileSync(path.join(migrationsFolder, file), "utf8");
    db.transaction(() => { db.exec(sql); insert.run(file); })();
    count++;
  }
  console.log(count ? `Migrations: ${count} applied.` : "Migrations: up to date.");
} else {
  console.log("No drizzle/ folder, skipping migrations.");
}

// --- Seed base admin ---
const email = (process.env.BASE_ADMIN_EMAIL || "").trim().toLowerCase();
if (email) {
  db.prepare(
    `INSERT INTO admin_users (email, is_base_admin, created_at)
     VALUES (?, 1, datetime('now'))
     ON CONFLICT(email) DO UPDATE SET is_base_admin = 1`
  ).run(email);
  console.log("Base admin ensured:", email);
}

db.close();
console.log("deploy-db complete.");
