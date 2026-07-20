/**
 * Backup CMS SQLite DB to S3 (gzip), prune backups older than retention window.
 * Requires: CMS_DB_PATH, S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
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
const bucket = process.env.S3_BUCKET;
const region = process.env.S3_REGION || "us-east-1";
const prefix = (process.env.CMS_DB_BACKUP_PREFIX || "backups/cms-db/").replace(/\/?$/, "/");
const retainWeeks = Math.max(1, parseInt(process.env.CMS_DB_BACKUP_RETAIN_WEEKS || "8", 10));

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

function backupKeyForDate(dateStr) {
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

async function uploadBackup(client, localGzPath, key) {
  const stat = fs.statSync(localGzPath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.createReadStream(localGzPath),
      ContentType: "application/gzip",
      ContentLength: stat.size,
      Metadata: {
        source: "heron-cms",
        "db-path": dbPath
      }
    })
  );
  console.log(`Uploaded s3://${bucket}/${key} (${stat.size} bytes)`);
}

async function pruneOldBackups(client) {
  const listed = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix
    })
  );
  const objects = (listed.Contents || [])
    .map((o) => ({ key: o.Key, date: parseDateFromKey(o.Key || "") }))
    .filter((o) => o.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const cutoff = new Date(Date.now() - retainWeeks * 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const toDelete = objects.filter((o) => o.date < cutoff);
  if (toDelete.length === 0) {
    console.log(`Retention: keeping all ${objects.length} backup(s) (keep >= ${cutoff}).`);
    return;
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
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
  requireEnv("S3_BUCKET");
  const dateStr = new Date().toISOString().slice(0, 10);
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "heron-cms-backup-"));
  const rawBackup = path.join(tmpDir, "cms.db");
  const gzBackup = path.join(tmpDir, "cms.db.gz");
  const s3Key = backupKeyForDate(dateStr);

  try {
    console.log("Backing up DB:", dbPath);
    await createSqliteBackup(dbPath, rawBackup);
    await gzipFile(rawBackup, gzBackup);
    const client = createS3Client();
    await uploadBackup(client, gzBackup, s3Key);
    await pruneOldBackups(client);
    console.log("backup-cms-db complete.");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("backup-cms-db failed:", err);
  process.exit(1);
});
