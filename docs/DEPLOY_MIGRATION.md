# Migrating from Bitnami to Lightsail Node.js (rsync + pm2)

Heron production deploys **your built app** on top of an AWS Lightsail blueprint. You do not upload a custom Lightsail blueprint; CI rsyncs the Next.js standalone output and pm2 runs `server.js`.

## Why migrate

Bitnami Node.js on Lightsail is deprecated ([FAQ](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-faq-bitnami-blueprints.html)). New instances should use the **Lightsail**-packaged **Node.js** blueprint (vendor shows as **Lightsail** in the console, not Bitnami).

## What changed in this repo

- `heron/scripts/deploy-runtime.sh` — detects Bitnami vs Lightsail paths on the server
- Deploy scripts work on **both** stacks during cutover
- GitHub Actions: optional `LIGHTSAIL_SSH_USER` secret (default `ubuntu` for Lightsail; use `bitnami` until you migrate)
- CI runs `npm rebuild better-sqlite3` so native modules match the Linux VM

## Cutover steps (nano instance, no Docker)

1. **Snapshot** the current production instance.
2. In Lightsail console, create a new instance:
   - Blueprint: **Node.js** (vendor **Lightsail**)
   - Bundle: same as today (e.g. nano)
   - Same SSH key pair as CloudFormation / GitHub secrets
3. Copy data from old host:
   ```bash
   rsync -avz -e "ssh -i lightsail.key" bitnami@OLD_IP:/var/lib/heron-cms/data/ ubuntu@NEW_IP:/var/lib/heron-cms/data/
   ```
4. In GitHub **production** environment, set secret `LIGHTSAIL_SSH_USER` to `ubuntu` (or rely on workflow default after merge).
5. **Attach the static IP** to the new instance (or let the deploy workflow update Route53 to the new IP).
6. Run **Deploy Lightsail CMS** workflow on `main`.
7. Verify HTTPS, admin login, uploads. Decommission the old instance after soak.

## CloudFormation note

Updating `LightsailBlueprintId` on an **existing** `AWS::Lightsail::Instance` may **replace** the instance. Prefer creating the new VM in the console, then updating DNS/static IP, rather than forcing a blueprint change on the live stack.

## Verify blueprint ID

```bash
aws lightsail get-blueprints --query "blueprints[?contains(name, 'Node')].[blueprintId,name,isActive]" --output table
```

Use the active Node.js blueprint whose vendor is Lightsail when launching new instances.
