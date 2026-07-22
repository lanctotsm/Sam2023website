# AI alt text (Amazon Bedrock Nova Lite)

Heron can generate accessibility alt text with **Amazon Nova Lite** via Bedrock.

## Enable

1. **Bedrock console (one-time):** in the app region, enable model access for **Amazon Nova Lite** (`amazon.nova-lite-v1:0`).
2. **IAM:** Deploy updates [`infra/lightsail-cms.yaml`](../infra/lightsail-cms.yaml) `CmsS3UploaderPolicy` with `bedrock:InvokeModel` on that foundation model. Ensure the CMS app IAM user (`APP_AWS_*`) still has this managed policy attached.
3. **Admin:** Settings → General → turn on **AI alt text (Bedrock)** → Save All.

## Behavior

- **Upload:** if the setting is on and the form alt field is empty, generate and store alt text (best-effort; upload succeeds even if Bedrock fails).
- **Edit Info:** **Generate alt text** fills the field; click **Save** to persist.

## Disable

Turn the setting off in Admin Settings (or set `ai_alt_text_enabled` to `false`).
