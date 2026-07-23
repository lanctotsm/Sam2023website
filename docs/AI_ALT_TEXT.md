# AI alt text

Heron can generate accessibility alt text with a vision model (Amazon Nova Lite via Bedrock).

IAM (`bedrock:InvokeModel` for Nova Lite) is on the existing CMS app policy in [`infra/lightsail-cms.yaml`](../infra/lightsail-cms.yaml). Deploy the stack so that policy update applies; no separate AWS console setup. Runtime credentials are `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (deploy maps GitHub `APP_AWS_*` secrets into those env vars).

## Enable

**Admin:** Settings → General → turn on **AI alt text** → Save All.

## Behavior

- **Upload:** if the setting is on and the form alt field is empty, generate and store alt text (best-effort; upload succeeds even if generation fails).
- **Edit Info:** **Generate alt text** fills the field; click **Save** to persist.

## Disable

Turn the setting off in Admin Settings (or set `ai_alt_text_enabled` to `false`).
