# CMS SQLite backup to S3

Ships `heron/scripts/backup-cms-db.cjs`, which copies the live SQLite DB to:

`s3://<CMS_BUCKET>/backups/cms-db/cms-YYYY-MM-DD.db.gz`

and prunes older weekly backups (default retain 8).

Requires app env on the host (already in `/opt/heron-cms/.env` after Deploy): `CMS_DB_PATH`, `S3_BUCKET`, `S3_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.

## After this PR is merged

1. Run **Deploy Lightsail CMS** (or wait for the next push to `main`) so `scripts/backup-cms-db.cjs` is rsynced to the Bitnami instance.
2. SSH in and take a backup:

```bash
cd /opt/heron-cms
export PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:$PATH"
set -a; . ./.env; set +a
node scripts/backup-cms-db.cjs
```

3. Confirm the object in S3 under `backups/cms-db/`.

Optional weekly cron (Bitnami), as the `bitnami` user:

```bash
crontab -e
# add:
15 3 * * 0 cd /opt/heron-cms && set -a && . ./.env && set +a && export PATH="/opt/bitnami/node/bin:/usr/local/bin:/usr/bin:$HOME/.local/bin:$PATH" && node scripts/backup-cms-db.cjs >> /var/log/heron-cms-db-backup.log 2>&1
```

## Cutover note

Take a fresh backup with this script **immediately before** moving to a new Lightsail runtime nano, then restore that object onto the new host (see `docs/DEPLOY_RUNTIME_IMAGE.md` after the runtime-image PR merges).
