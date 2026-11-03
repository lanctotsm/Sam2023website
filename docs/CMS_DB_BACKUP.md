# CMS data: S3 backups + Lightsail block disk

## Goal

Keep SQLite on a **Lightsail attached disk** (`heron-cms-data` by default) mounted at `/var/lib/heron-cms/data` (`CMS_DB_PATH`). After the **one-time** migrate on Bitnami, replacing the VM is: detach disk → attach to new nano → deploy. **No DB copy / S3 restore for cutover.**

S3 backups remain for disaster recovery (disk failure, accidents), not for routine host moves.

## What this PR adds

| Piece | Role |
| --- | --- |
| `heron/scripts/backup-cms-db.cjs` | Upload `cms.db` → `s3://…/backups/cms-db/` |
| `infra/lightsail-cms.yaml` | `AWS::Lightsail::Disk` + attach to the instance at `/dev/xvdf` |
| `heron/scripts/mount-cms-data-disk.sh` | Format (once), migrate rootfs data (once), fstab + mount |
| Deploy workflow | Passes instance AZ into CFN; runs mount script after SSH |

Disk cost: **8 GB** Lightsail storage ≈ **$0.80/mo** (minimum size).

## After merge (Bitnami — do this once)

1. Confirm DB path on the live host: `ls -la /var/lib/heron-cms/data/cms.db`
2. Confirm the GitHub deploy AWS user can manage Lightsail disks (or `lightsail:*`); otherwise CloudFormation will fail.
3. Run **Deploy Lightsail CMS**.
   - CloudFormation creates/attaches the data disk (**instance restarts**; static IP stays).
   - Deploy stops the app, best-effort S3 backup, then mounts/migrates (refuses to format unknown devices or migrate while `:3000` is still up).
4. Confirm site works and `findmnt /var/lib/heron-cms/data`.
5. After soak, delete `/var/lib/heron-cms/data.rootfs-bak-*` on the instance.

Optional weekly backup cron (Bitnami user):

```bash
15 3 * * 0 cd /opt/heron-cms && set -a && . ./.env && set +a && export PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:$HOME/.local/bin:$PATH" && node scripts/backup-cms-db.cjs >> /var/log/heron-cms-db-backup.log 2>&1
```

## Later: runtime-image / new nano cutover (no DB migrate)

1. Build/launch new nano from `heron-runtime-*` snapshot.
2. Lightsail → **Storage** → disk `heron-cms-data` → **Detach** from old → **Attach** to new (same path `/dev/xvdf` if prompted).
3. Swap static IP to the new instance.
4. Set `LIGHTSAIL_SSH_USER=ubuntu`, run **Deploy** (mount script mounts the existing filesystem; it will **not** re-format a disk that already has a filesystem).

## Manual checks

```bash
findmnt /var/lib/heron-cms/data
ls -la /var/lib/heron-cms/data/cms.db
test -f /var/lib/heron-cms/.data-on-block-disk && echo ok
```

## Private backup storage

Database snapshots contain private content and must not be served through the
media CDN. `CmsBackupBucket` is a separate encrypted, versioned S3 bucket with
public access blocked and an explicit denial of CloudFront reads. CloudFormation
retains the bucket if the stack is deleted or the resource is replaced. Previous
object versions expire after 56 days; the backup script prunes current snapshots
according to `CMS_DB_BACKUP_RETAIN_WEEKS` (default 8).

The deploy workflow reads the `BackupBucket` stack output, uses it for the
pre-migration snapshot, and writes it as `CMS_DB_BACKUP_BUCKET` into the server's
`.env` for the weekly cron. The script refuses to run when that variable is missing
or equals `S3_BUCKET`; there is no public-bucket fallback. Custom backup prefixes
must remain under `backups/`. `--validate-config` checks this without creating a
snapshot or contacting S3, and cron installation runs that validation first.

The media CDN may read only `uploads/`, `backgrounds/`, and `resume/`. Adding a new
public object prefix requires an explicit policy change. The deployment identity
needs permission to create/configure the backup bucket and its policy, update the
app's managed IAM policy, and call `cloudfront:CreateInvalidation` and
`cloudfront:GetInvalidation`. The existing app IAM policy grants backup read,
write, list, and retention deletion only under the private bucket's `backups/`
prefix. No new GitHub bucket secret is needed.

### Existing deployments: remove legacy public access

Merging code alone does not close an existing exposure. Review the CloudFormation
change set, then deploy the storage policy changes and complete these checks:

1. Confirm `CmsBackupBucket` exists and the application IAM user has the updated
   managed policy. Confirm the media bucket policy allows only the public
   prefixes above and explicitly denies CloudFront reads of `backups/`.
2. Evict old snapshots from CloudFront. The workflow invalidates `/backups/*` and
   waits for completion after applying the origin policy. If an older deployment
   used a custom prefix outside `backups/`, verify that prefix is excluded by the
   new allowlist. If it was inside a public media prefix, add an explicit deny for
   that legacy backup prefix first. Then invalidate that prefix as well (or
   invalidate `/*` once). Origin policy changes do **not** evict cached objects.
3. Use an authenticated operator account to copy retained legacy snapshots into
   the private bucket. Verify the copied objects before deleting any legacy
   copies. Do not download snapshots via the public CDN as a verification step.
4. Run the backup script on the server, inspect its log, and verify the new object
   exists in the private bucket. Check a legacy CDN snapshot URL with an
   unauthenticated HEAD request; it must return 403 or 404. Also check an uploaded
   photo, a background, and the resume PDF still load.
5. Review available CloudFront/S3 access logs for previous access. If any secrets
   were stored in the database, rotate those secrets. Snapshots are private even
   when there are no secrets: drafts and administrator email addresses belong in
   the private bucket.

Example operator commands (replace the variables with the actual stack outputs;
these commands are **not** run by the application):

```bash
aws cloudfront create-invalidation --distribution-id "$CMS_DISTRIBUTION_ID" --paths '/backups/*'
# Wait for the returned invalidation ID before checking public access.
aws cloudfront wait invalidation-completed --distribution-id "$CMS_DISTRIBUTION_ID" --id "$CMS_INVALIDATION_ID"
aws s3 cp "s3://$CMS_MEDIA_BUCKET/backups/" "s3://$CMS_PRIVATE_BACKUP_BUCKET/backups/" --recursive
aws s3 ls "s3://$CMS_PRIVATE_BACKUP_BUCKET/backups/" --recursive
```

### Restore verification

Retrieve a selected snapshot using authenticated S3 access into a temporary
location, decompress it, and run SQLite `PRAGMA integrity_check` before replacing
any database. Stop the app before a real restore and preserve the current database
and its WAL/SHM files. Restore drills should use an isolated database path and
private local files, not the running production database.

For local MinIO backup testing, create a separate `cms-backups` bucket and keep
anonymous access disabled (`mc anonymous set none local/cms-backups`). Set
`CMS_DB_BACKUP_BUCKET=cms-backups`; never apply the media bucket's anonymous
download policy to it.
