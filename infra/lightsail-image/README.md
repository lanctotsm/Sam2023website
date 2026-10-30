# Heron Lightsail runtime image

Builds a **runtime-only** Lightsail instance snapshot for the Heron CMS nano VM:

- Ubuntu OS blueprint (seed)
- Node.js 24
- Apache (`proxy` / `ssl` modules; vhost written at app deploy)
- pm2 (per `ubuntu` user)
- App dirs: `/opt/heron-cms`, `/var/lib/heron-cms/data`
- apt-daily / unattended upgrades **disabled** (OS updates via runtime bake + host rebuild only)

The Next.js app is **not** baked into the image. App releases use the existing **Deploy Lightsail CMS** workflow (rsync + migrate + pm2). Host OS package updates land when you rebuild the runtime image / host — not via apt-daily on the live nano.

## Snapshot naming

The GitHub Actions workflow creates snapshots named:

```text
heron-runtime-YYYYMMDD-<gitsha7>
```

Example: `heron-runtime-20260719-a1b2c3d`

## Launch a nano from a snapshot

1. Lightsail console → **Snapshots** → choose `heron-runtime-…`
2. **Create new instance** → bundle **nano** (cannot be smaller than the source)
3. Same region; attach the deploy SSH key pair
4. Firewall: TCP **22**, **80**, **443**
5. Reattach the `heron-cms-data` disk (no DB copy) — see cutover docs
6. Attach the production **static IP**, set GitHub secret `LIGHTSAIL_SSH_USER=ubuntu`, run **Deploy Lightsail CMS**

See [docs/DEPLOY_RUNTIME_IMAGE.md](../../docs/DEPLOY_RUNTIME_IMAGE.md) for full cutover and monthly rebuild steps.

## Manual provision (debug)

On a fresh Ubuntu Lightsail nano:

```bash
sudo IMAGE_VERSION=manual-$(date +%Y%m%d) bash provision.sh
```

## Workflow

[`.github/workflows/build-lightsail-runtime.yml`](../../.github/workflows/build-lightsail-runtime.yml) runs on `workflow_dispatch` and monthly. It creates a temporary nano, runs `provision.sh`, snapshots, then deletes the builder.
