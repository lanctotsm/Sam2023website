# React Frontend

This React app renders the authenticated album and photo management experience. The UI is built with [Chakra UI](https://chakra-ui.com/) for layout and styling and integrates with the album/photo backend via secure OAuth sessions.

## Requirements

- Node.js 18+
- npm 9+

## Environment Variables

Create an `.env` file (or configure your shell) with:

```bash
REACT_APP_API_BASE_URL=https://your-api-gateway-url.example.com/dev
REACT_APP_PHOTO_CDN_URL=https://your-photo-bucket.s3.amazonaws.com
```

- `REACT_APP_API_BASE_URL` — API Gateway base URL that exposes `/auth`, `/albums`, and `/upload`.
- `REACT_APP_PHOTO_CDN_URL` — Public base URL used to render album thumbnails and photo variants. Leave empty to hide thumbnails.

## Scripts

```bash
npm install        # install dependencies
npm start          # run locally on http://localhost:3000
npm test           # run Jest + Testing Library suite
npm run build      # create production build in app/build
```

The test suite mocks the backend status check, so the env variables only need to be defined for `start` and `build`.

## Feature Overview

- **Authentication** – `AuthProvider` polls `/auth/status`, drives login/logout, and hides protected routes (upload).
- **Albums** – responsive grid with create modal, using Chakra cards. Album detail view displays album metadata and photo grid.
- **Uploads** – form requires selecting an album, previews tags/title metadata, and posts directly to `/upload`.
- **Component Library** – Chakra UI provides layout, modal, cards, alerts, and responsive primitives so we avoid bespoke CSS components.

## GitHub Actions Deployment

The workflow `.github/workflows/frontend-deploy.yml` builds the React app and (optionally) deploys to S3/CloudFront.

Configure the following repository secrets:

| Secret | Description |
| --- | --- |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Credentials with permission to sync to the target bucket (and invalidate CloudFront if used). |
| `AWS_REGION` | Region for CLI commands (e.g., `us-east-1`). |
| `FRONTEND_BUCKET_NAME` | Destination S3 bucket for the static site. |
| `FRONTEND_API_BASE_URL` | Passed into the build as `REACT_APP_API_BASE_URL`. |
| `FRONTEND_CDN_BASE_URL` | Passed into the build as `REACT_APP_PHOTO_CDN_URL`. |
| `FRONTEND_CLOUDFRONT_DISTRIBUTION_ID` | (Optional) distribution to invalidate after sync. |

Pushes to `main` (or manual `workflow_dispatch`) will build and deploy automatically once secrets are present.
