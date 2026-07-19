# Heron Lightsail runtime image — cutover and security rebuilds

Production runs on a **Lightsail nano VM**. The OS/runtime is a golden **instance snapshot** you control; app releases still **rsync** the Next.js standalone build (no Docker).

This supersedes the Bitnami → Lightsail Node.js blueprint approach in PR #99. Long-term base is **your** `heron-runtime-*` snapshot (seeded once from an Ubuntu OS blueprint), not AWS’s Node.js app blueprint.

## Architecture

| Piece | Role |
| --- | --- |
| Runtime snapshot (`heron-runtime-YYYYMMDD-<sha>`) | Ubuntu + Node 24 + Apache + pm2 + `/opt/heron-cms` + `/var/lib/heron-cms/data` |
| Deploy Lightsail CMS workflow | Build app → rsync → migrate → pm2 → Apache/Let’s Encrypt |
| Build Lightsail runtime workflow | Monthly / on-demand: provision Ubuntu nano → snapshot → delete builder |
| CloudFormation (`infra/lightsail-cms.yaml`) | S3, CloudFront, static IP attachment to the named instance — **do not** change live `BlueprintId` to swap VMs |

## One-time cutover (Bitnami → custom runtime)

### 1. Backup current prod

1. Lightsail → current instance → **Snapshots** → create a manual snapshot.
2. Optionally confirm S3 DB backups under `s3://<CMS_BUCKET>/backups/cms-db/`.

### 2. Build the golden runtime

1. Merge this work to `main` (or run the workflow from the branch with production secrets).
2. Actions → **Build Lightsail runtime** → **Run workflow**.
3. Copy the snapshot name from the job summary (e.g. `heron-runtime-20260719-a1b2c3d`).

### 3. Launch a new nano from the snapshot

1. Lightsail → **Snapshots** → that snapshot → **Create new instance**.
2. Bundle: **nano** (cannot be smaller than the source snapshot).
3. Same region; use the **same SSH key pair** as `LIGHTSAIL_KEY_PAIR_NAME`.
4. Name e.g. `heron-cms-new` (temporary) or the production name if the old instance is already renamed/stopped.

### 4. Firewall

On the new instance Networking tab, allow TCP **22**, **80**, **443**.

Do **not** move the static IP yet.

### 5. Copy CMS data

With both instances up (app preferably stopped on the new host):

```bash
rsync -avz -e "ssh -i lightsail.key" \
  bitnami@OLD_IP:/var/lib/heron-cms/data/ \
  ubuntu@NEW_IP:/var/lib/heron-cms/data/
```

### 6. GitHub production environment

1. Set secret `LIGHTSAIL_SSH_USER` to `ubuntu`.
2. If the instance **name** changes, update `LIGHTSAIL_INSTANCE_NAME` (and ensure CloudFormation / static IP attachment still targets the instance that will own the IP). Prefer attaching the existing static IP to the new instance in the console, then keep the same instance name in secrets once renamed, or update secrets to match.

### 7. Cut traffic

1. Detach the static IP from the old instance → attach to the new instance.
2. Run **Deploy Lightsail CMS**.
3. Verify HTTPS, admin login, image upload, and DB.

### 8. Decommission

After a soak period, stop/delete the old Bitnami instance (keep its snapshot for a while). Close PR #99 if still open (superseded by this path).

Until cutover is complete, keep `LIGHTSAIL_SSH_USER=bitnami` so deploys still reach the old host.

## Monthly security rebuild

1. **Build Lightsail runtime** runs on a schedule (or manually) and publishes a new `heron-runtime-*` snapshot.
2. Create a replacement nano from the new snapshot.
3. Copy `/var/lib/heron-cms/data` from the current prod nano (or restore from S3 backup).
4. Swap the static IP → run **Deploy Lightsail CMS** once → retire the previous nano.
5. App-only releases do **not** require an image rebuild — push to `main` as usual.

## Operator notes

- SSH user on custom images is **`ubuntu`**.
- Native module `better-sqlite3` is rebuilt in CI for Linux so it matches the nano.
- Deploy scripts auto-detect Bitnami vs Ubuntu (`heron/scripts/deploy-runtime.sh`) during cutover.
- Image provisioner: [`infra/lightsail-image/provision.sh`](../infra/lightsail-image/provision.sh).
- Image README: [`infra/lightsail-image/README.md`](../infra/lightsail-image/README.md).

## Cost

- Prod nano: same Lightsail plan as today (e.g. ~$5/mo for `nano_3_0` with public IPv4).
- Builder nano: billed only while the image workflow runs.
- Snapshots: ~$0.05 per GB-month of snapshot storage.
