import { createRequire } from "node:module";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";

const requireScript = createRequire(import.meta.url);
const { readBackupConfig, uploadBackup, pruneOldBackups } = requireScript("../scripts/backup-cms-db.cjs");
const validEnv = { S3_BUCKET: "public-media", CMS_DB_BACKUP_BUCKET: "private-backups" };
const tempDirs: string[] = [];

// Preserve CloudFormation references while inspecting policy structure.
const yaml = requireScript("js-yaml");
const schema = yaml.DEFAULT_SCHEMA.extend(["!Ref", "!Sub", "!GetAtt"].map((tag) =>
  new yaml.Type(tag, { kind: "scalar", construct: (value: string) => value })
));
const infrastructure = yaml.load(readFileSync(path.join(process.cwd(), "../infra/lightsail-cms.yaml"), "utf8"), { schema });

describe("backup access policies", () => {
  it("allows CDN reads only from public media prefixes, never the bucket root", () => {
    const statements = infrastructure.Resources.CmsBucketPolicy.Properties.PolicyDocument.Statement;
    const allows = statements.filter((entry: { Effect: string }) => entry.Effect === "Allow");
    expect(allows).toHaveLength(1);
    expect(allows[0]).toMatchObject({
      Principal: { Service: "cloudfront.amazonaws.com" },
      Action: "s3:GetObject",
      Resource: ["${CmsBucket.Arn}/uploads/*", "${CmsBucket.Arn}/backgrounds/*", "${CmsBucket.Arn}/resume/*"],
      Condition: { StringEquals: { "AWS:SourceArn": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CmsDistribution}" } }
    });
    expect(statements).toContainEqual(expect.objectContaining({
      Effect: "Deny", Principal: { Service: "cloudfront.amazonaws.com" },
      Action: "s3:GetObject", Resource: "${CmsBucket.Arn}/backups/*"
    }));
  });

  it("retains a separate private backup bucket and explicitly denies CDN access", () => {
    const bucket = infrastructure.Resources.CmsBackupBucket;
    expect(bucket.DeletionPolicy).toBe("Retain");
    expect(bucket.UpdateReplacePolicy).toBe("Retain");
    expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true
    });
    const policy = infrastructure.Resources.CmsBackupBucketPolicy.Properties;
    expect(policy.Bucket).toBe("CmsBackupBucket");
    expect(policy.PolicyDocument.Statement).toContainEqual(expect.objectContaining({
      Effect: "Deny", Principal: { Service: "cloudfront.amazonaws.com" },
      Action: "s3:GetObject", Resource: "${CmsBackupBucket.Arn}/*"
    }));
    expect(policy.PolicyDocument.Statement).toContainEqual(expect.objectContaining({
      Effect: "Deny", Principal: "*", Action: "s3:*", Condition: { Bool: { "aws:SecureTransport": "false" } }
    }));
    expect(infrastructure.Outputs.BackupBucket.Value).toBe("CmsBackupBucket");
  });
});

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("private database backup destination", () => {
  it("never falls back to public media when no backup bucket is configured", () => {
    expect(() => readBackupConfig({ S3_BUCKET: "public-media" })).toThrow("CMS_DB_BACKUP_BUCKET is required");
    expect(() => readBackupConfig({ CMS_DB_BACKUP_BUCKET: "private-backups" })).toThrow("S3_BUCKET is required");
  });

  it("rejects the media bucket, including whitespace-padded configuration", () => {
    expect(() => readBackupConfig({ S3_BUCKET: "public-media", CMS_DB_BACKUP_BUCKET: " public-media " }))
      .toThrow("must differ");
  });

  it("requires backups to stay inside the IAM-authorized backup prefix", () => {
    for (const prefix of ["uploads/", "/backups/", "backups/../uploads/", "backups\\test/", "backups/a b/"]) {
      expect(() => readBackupConfig({ ...validEnv, CMS_DB_BACKUP_PREFIX: prefix })).toThrow("under backups/");
    }
    expect(readBackupConfig({ ...validEnv, CMS_DB_BACKUP_PREFIX: "backups/custom" }).prefix).toBe("backups/custom/");
  });

  it("rejects invalid retention rather than silently keeping or deleting the wrong backups", () => {
    for (const weeks of ["0", "-1", "NaN", "1.5", "8weeks"]) {
      expect(() => readBackupConfig({ ...validEnv, CMS_DB_BACKUP_RETAIN_WEEKS: weeks })).toThrow("positive integer");
    }
  });

  it("validates configuration before reading the database or calling S3", () => {
    const result = spawnSync(process.execPath, ["scripts/backup-cms-db.cjs", "--validate-config"], {
      cwd: process.cwd(),
      env: { ...process.env, S3_BUCKET: "public-media", CMS_DB_BACKUP_BUCKET: "public-media", CMS_DB_PATH: "/missing/cms.db" },
      encoding: "utf8"
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("must differ");
    expect(result.stderr).not.toContain("Database not found");
  });

  it("uploads only to the dedicated bucket with no-store caching and no server-path metadata", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "heron-backup-security-"));
    tempDirs.push(dir);
    const file = path.join(dir, "cms.db.gz");
    writeFileSync(file, "test snapshot");
    const send = vi.fn(async (command) => {
      for await (const _chunk of command.input.Body) { /* Consume the stream like the SDK. */ }
      return {};
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    await uploadBackup({ send }, readBackupConfig(validEnv), file, "backups/cms-db/cms-2026-01-01.db.gz");
    expect(send.mock.calls[0][0].input).toMatchObject({
      Bucket: "private-backups",
      CacheControl: "private, no-store",
      Metadata: { source: "heron-cms" }
    });
    expect(send.mock.calls[0][0].input.Metadata).not.toHaveProperty("db-path");
  });

  it("lists and prunes only the dedicated backup bucket", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const send = vi.fn().mockResolvedValueOnce({ Contents: [
      { Key: "backups/cms-db/cms-2000-01-01.db.gz" },
      { Key: `backups/cms-db/cms-${today}.db.gz` },
      { Key: "backups/cms-db/README.txt" }
    ] }).mockResolvedValueOnce({});
    vi.spyOn(console, "log").mockImplementation(() => {});
    await pruneOldBackups({ send }, readBackupConfig(validEnv));
    expect(send.mock.calls[0][0].input).toEqual({ Bucket: "private-backups", Prefix: "backups/cms-db/" });
    expect(send.mock.calls[1][0].input).toEqual({
      Bucket: "private-backups",
      Delete: { Objects: [{ Key: "backups/cms-db/cms-2000-01-01.db.gz" }], Quiet: true }
    });
  });
});
