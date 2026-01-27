# GitHub Copilot Instructions for Heron

## Project Overview

Heron is a modern, lightweight CMS built with Next.js, SQLite, and Drizzle ORM. It is designed for personal websites and portfolios, with integrated support for media management (S3/MinIO), blog posts, and photo albums.

## Repository Structure

```
/
├── heron/                  # Main Next.js application
│   ├── app/                # Next.js App Router (pages, API routes)
│   ├── components/         # React components
│   ├── drizzle/            # Database migrations
│   ├── lib/                # Shared utilities, DB schema, S3 client
│   ├── public/             # Static assets
│   ├── scripts/            # Development and seeding scripts
│   ├── types/              # TypeScript definitions
│   ├── Dockerfile          # Production Docker image
│   └── package.json        # Dependencies and scripts
├── infra/                  # Infrastructure as Code (Lightsail CloudFormation)
└── docker-compose.yml      # Local development and production orchestration
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite (via better-sqlite3)
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js (Google OAuth & local dev bypass)
- **Storage**: S3-compatible (AWS S3 in production, MinIO in dev)
- **Deployment**: Docker on AWS Lightsail

## Development Workflow

### Local Development Environment

1. **Environment Setup**: Copy `.env.example` to `.env` in the root and configure.
2. **Start Services**: `docker-compose -f docker-compose.dev.yml up`
   - Runs the Next.js app in development mode
   - Runs MinIO for local object storage
3. **Database & Seeding**:
   - The app automatically runs migrations on startup.
   - Seed data: `cd heron && npm run seed:local`

### Building and Testing

- **Production Build**: `cd heron && npm run build`
- **Linting**: `cd heron && npm run lint`
- **Type Checking**: `cd heron && npm run typecheck`

## Coding Conventions

### Next.js & React

- **App Router**: Use the `app/` directory for routing. Use Server Components by default.
- **Components**: Place reusable components in `heron/components/`.
- **API Routes**: Implement backend logic in `heron/app/api/`.

### Database & ORM

- **Schema**: Defined in `heron/lib/db/schema.ts`.
- **Migrations**: Managed by Drizzle Kit. Run `npx drizzle-kit generate` for schema changes.
- **Client**: Access the database via `getDb()` from `heron/lib/db/index.ts`.

### Storage

- Use the S3 client in `heron/lib/s3.ts` for all media operations.
- Images are served via presigned URLs or public base URLs configured in environment variables.

## Best Practices

1. **Keep it Simple**: Prioritize SQLite for its simplicity and portability.
2. **Server-Side First**: Leverage Next.js Server Components for data fetching.
3. **Type Safety**: Use TypeScript for all new code. Ensure Drizzle schema and TypeScript types are in sync.
4. **Local Dev Parity**: Use the provided `docker-compose.dev.yml` to ensure local dev matches production as closely as possible.
5. **Security**: Never commit secrets. Use `.env.local` for local overrides and GitHub Secrets for CI/CD.

## Deployment

- **CI/CD**: GitHub Actions (`.github/workflows/deploy-lightsail.yml`) builds the Docker image and deploys to AWS Lightsail.
- **Infrastructure**: Managed via the CloudFormation template in `infra/lightsail-cms.yaml`.
- **Environment**: Production environment variables are managed on the Lightsail instance.

## Important Notes

- **Working Directory**: Most development happens within the `heron/` directory.
- **Package Manager**: Use `npm`.
- **Database Path**: In Docker, the SQLite database is stored at `/app/data/cms.db`. Ensure this volume is persisted.
