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
