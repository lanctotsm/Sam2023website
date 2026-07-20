# Heron Lightsail runtime image — cutover and security rebuilds

Production runs on a **Lightsail nano VM**. The OS/runtime is a golden **instance snapshot** you control; app releases still **rsync** the Next.js standalone build (no Docker).

This supersedes the Bitnami → Lightsail Node.js blueprint approach in PR #99. Long-term base is **your** `heron-runtime-*` snapshot (seeded once from an Ubuntu OS blueprint), not AWS’s Node.js app blueprint.

SQLite lives on the attached Lightsail disk `heron-cms-data` at `/var/lib/heron-cms/data` (see [`CMS_DB_BACKUP.md`](./CMS_DB_BACKUP.md) / PR #101). After that one-time migrate, host cutovers **reattach the disk** — no DB copy.

## Architecture

| Piece | Role |
| --- | --- |
| Runtime snapshot (`heron-runtime-YYYYMMDD-<sha>`) | Ubuntu + Node 24 + Apache + pm2 + app dirs |
| Data disk (`heron-cms-data`) | Persistent SQLite at `/var/lib/heron-cms/data` |
| Deploy Lightsail CMS workflow | Build app → mount disk → rsync → migrate → pm2 → Apache/Let’s Encrypt |
| Build Lightsail runtime workflow | Monthly / on-demand: provision Ubuntu nano → snapshot → delete builder |
| CloudFormation (`infra/lightsail-cms.yaml`) | S3, CloudFront, static IP, data disk — **do not** change live `BlueprintId` to swap VMs |

## One-time cutover (Bitnami → custom runtime)

Prerequisite: PR #101 already deployed so `cms.db` is on the block disk (`findmnt /var/lib/heron-cms/data`).

### 1. Snapshot old instance (safety)

Lightsail → current instance → **Snapshots** → create a manual snapshot.

### 2. Build the golden runtime

1. Merge this work to `main` (or run the workflow from the branch with production secrets).
2. Actions → **Build Lightsail runtime** → **Run workflow**.
3. Copy the snapshot name from the job summary (e.g. `heron-runtime-20260719-a1b2c3d`).

### 3. Launch a new nano from the snapshot

1. Lightsail → **Snapshots** → that snapshot → **Create new instance**.
2. Bundle: **nano** (cannot be smaller than the source snapshot).
3. Same region; use the **same SSH key pair** as `LIGHTSAIL_KEY_PAIR_NAME`.
4. Name e.g. `heron-cms-new`.

### 4. Firewall

On the new instance Networking tab, allow TCP **22**, **80**, **443**.

Do **not** move the static IP yet.

### 5. Move the data disk (no DB copy)

1. Stop the app on the old host if needed (`pm2 stop heron-cms`).
2. Lightsail → **Storage** → `heron-cms-data` → **Detach** from old instance.
3. **Attach** to `heron-cms-new` (path `/dev/xvdf` if prompted).

### 6. GitHub production environment

1. Set secret `LIGHTSAIL_SSH_USER` to `ubuntu`.
2. Point `LIGHTSAIL_INSTANCE_NAME` at the instance that will own the static IP (or rename after swap).

### 7. Cut traffic

1. Detach the static IP from the old instance → attach to the new instance.
2. Run **Deploy Lightsail CMS** (mount script mounts the existing filesystem; it will not re-format a disk that already has data).
3. Verify HTTPS, admin login, image upload, and DB.

### 8. Decommission

After a soak period, stop/delete the old Bitnami instance (keep its snapshot a while).

Until cutover is complete, keep `LIGHTSAIL_SSH_USER=bitnami` so deploys still reach the old host.

## Monthly security rebuild

1. **Build Lightsail runtime** → new `heron-runtime-*` snapshot.
2. Create a replacement nano from that snapshot.
3. Detach `heron-cms-data` from current prod → attach to the new nano.
4. Swap static IP → run **Deploy Lightsail CMS** → retire previous nano.
5. App-only releases do **not** require an image rebuild — push to `main` as usual.

## Operator notes

- SSH user on custom images is **`ubuntu`**.
- Native module `better-sqlite3` is rebuilt in CI for Linux so it matches the nano.
- Deploy scripts auto-detect Bitnami vs Ubuntu (`heron/scripts/deploy-runtime.sh`) during cutover.
- Image provisioner: [`infra/lightsail-image/provision.sh`](../infra/lightsail-image/provision.sh).
- Image README: [`infra/lightsail-image/README.md`](../infra/lightsail-image/README.md).
- Data disk / S3 DR: [`CMS_DB_BACKUP.md`](./CMS_DB_BACKUP.md).

## Cost

- Prod nano: same Lightsail plan as today (e.g. ~$5/mo for `nano_3_0` with public IPv4).
- Data disk: ~$0.80/mo for 8 GB.
- Builder nano: billed only while the image workflow runs.
- Snapshots: ~$0.05 per GB-month of snapshot storage.
