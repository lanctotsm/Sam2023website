/**
 * Backup CMS SQLite DB to S3 (gzip), prune backups older than retention window.
 * Requires: CMS_DB_BACKUP_BUCKET (private), S3_BUCKET (public media), AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 * Optional: CMS_DB_BACKUP_PREFIX (default backups/cms-db/), CMS_DB_BACKUP_RETAIN_WEEKS (default 8)
 */
const Database = require("better-sqlite3");
const {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");

const dbPath = process.env.CMS_DB_PATH || path.join(process.cwd(), "data", "cms.db");
const region = process.env.S3_REGION || "us-east-1";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

/** Refuse any fallback to the bucket served by the public media CDN. */
function readBackupConfig(env = process.env) {
  const bucket = (env.CMS_DB_BACKUP_BUCKET || "").trim();
  const mediaBucket = (env.S3_BUCKET || "").trim();
  if (!bucket) throw new Error("CMS_DB_BACKUP_BUCKET is required; backups must use a private bucket.");
  if (!mediaBucket) throw new Error("S3_BUCKET is required to verify backup/media separation.");
  if (bucket === mediaBucket) throw new Error("CMS_DB_BACKUP_BUCKET must differ from the public S3_BUCKET.");
  const prefix = (env.CMS_DB_BACKUP_PREFIX || "backups/cms-db/").replace(/\/?$/, "/");
  if (!prefix.startsWith("backups/") || /[\\\s]/.test(prefix) || prefix.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("CMS_DB_BACKUP_PREFIX must be a path under backups/.");
  }
  const retainWeeks = Number(env.CMS_DB_BACKUP_RETAIN_WEEKS || "8");
  if (!Number.isSafeInteger(retainWeeks) || retainWeeks < 1) {
    throw new Error("CMS_DB_BACKUP_RETAIN_WEEKS must be a positive integer.");
  }
  return { bucket, prefix, retainWeeks };
}

function backupKeyForDate(prefix, dateStr) {
  return `${prefix}cms-${dateStr}.db.gz`;
}

function parseDateFromKey(key) {
  const match = key.match(/cms-(\d{4}-\d{2}-\d{2})\.db\.gz$/);
  return match ? match[1] : null;
}

async function gzipFile(inputPath, outputPath) {
  await pipeline(
    fs.createReadStream(inputPath),
    zlib.createGzip(),
    fs.createWriteStream(outputPath)
  );
}

async function createSqliteBackup(sourcePath, destPath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Database not found: ${sourcePath}`);
  }
  const db = new Database(sourcePath, { readonly: true });
  try {
    await db.backup(destPath);
  } finally {
    db.close();
  }
}

function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT_URL;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: endpoint ? forcePathStyle : undefined,
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY")
    }
  });
}

async function uploadBackup(client, config, localGzPath, key) {
  const stat = fs.statSync(localGzPath);
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: fs.createReadStream(localGzPath),
      ContentType: "application/gzip",
      ContentLength: stat.size,
      CacheControl: "private, no-store",
      Metadata: {
        source: "heron-cms"
      }
    })
  );
  console.log(`Uploaded s3://${config.bucket}/${key} (${stat.size} bytes)`);
}

async function pruneOldBackups(client, config) {
  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: config.prefix
    })
  );
  const objects = (listed.Contents || [])
    .map((o) => ({ key: o.Key, date: parseDateFromKey(o.Key || "") }))
    .filter((o) => o.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const cutoff = new Date(Date.now() - config.retainWeeks * 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const toDelete = objects.filter((o) => o.date < cutoff);
  if (toDelete.length === 0) {
    console.log(`Retention: keeping all ${objects.length} backup(s) (keep >= ${cutoff}).`);
    return;
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: config.bucket,
      Delete: {
        Objects: toDelete.map((o) => ({ Key: o.key })),
        Quiet: true
      }
    })
  );
  console.log(`Retention: deleted ${toDelete.length} backup(s) older than ${cutoff}.`);
  for (const o of toDelete) {
    console.log(`  removed ${o.key}`);
  }
}

async function main() {
  const config = readBackupConfig();
  if (process.argv.includes("--validate-config")) return;
  const dateStr = new Date().toISOString().slice(0, 10);
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "heron-cms-backup-"));
  const rawBackup = path.join(tmpDir, "cms.db");
  const gzBackup = path.join(tmpDir, "cms.db.gz");
  const s3Key = backupKeyForDate(config.prefix, dateStr);

  try {
    console.log("Backing up DB:", dbPath);
    await createSqliteBackup(dbPath, rawBackup);
    await gzipFile(rawBackup, gzBackup);
    const client = createS3Client();
    await uploadBackup(client, config, gzBackup, s3Key);
    await pruneOldBackups(client, config);
    console.log("backup-cms-db complete.");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { readBackupConfig, uploadBackup, pruneOldBackups };

if (require.main === module) {
  main().catch((err) => {
    console.error("backup-cms-db failed:", err);
    process.exitCode = 1;
  });
}
