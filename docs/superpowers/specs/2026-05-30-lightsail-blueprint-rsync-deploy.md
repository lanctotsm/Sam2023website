# Lightsail blueprint + CI rsync deploy (approved)

**Status:** Implemented in `deploy/lightsail-nodejs-blueprint`  
**Date:** 2026-05-30

## Summary

- **Host:** AWS Lightsail **Node.js** blueprint (Lightsail vendor), `nano_3_0`, no server Docker
- **App:** CI builds Next.js standalone on Node 24; `npm rebuild better-sqlite3`; rsync + pm2
- **Scripts:** `deploy-runtime.sh` auto-detects Bitnami vs Lightsail Apache/Node paths
- **SSH:** `LIGHTSAIL_SSH_USER` secret (`ubuntu` after migration; default `bitnami` for existing prod)

See `docs/DEPLOY_MIGRATION.md` for cutover steps.
