# CardThings

CardThings is a generic, self-hosted catalogue for curated software and other link-based collections. Visitors browse public cards and dedicated detail pages; administrators manage tools, categories, tags, publication state, and external download sources.

CardThings stores descriptions and links, not installer binaries. Official and mirror files remain with their external providers.

![CardThings public catalogue](docs/screenshots/catalogue-desktop.png)

## First milestone

- Public catalogue with text, category, and platform filters
- Published-only detail routes with version, installation, source, licence, episode, and download metadata
- Explicit official or mirror source labels; every download opens the external provider
- Custom admin login and server-authorized tool, category, and tag CRUD
- Draft and published tool states
- Deterministic fictional seed data that inserts missing rows without replacing edits
- SQLite migrations, persistent Docker volumes, and documented backup/restore procedures

Accounts for ordinary visitors, registration, favourites, uploads, and binary hosting are deliberately outside this milestone.

![Custom CardThings admin login](docs/screenshots/admin-login-desktop.png)

## Stack

- Next.js 16, React 19, and TypeScript
- Tailwind CSS 4 with selected shadcn/ui primitives
- SQLite with Drizzle ORM and committed migrations
- Better Auth email/password sessions
- Playwright and Vitest
- Docker Compose

## Local setup

Requires Node.js 22.12 or newer.

```bash
npm ci
cp .env.example .env.local
openssl rand -base64 32
```

Put the generated value in `BETTER_AUTH_SECRET` inside `.env.local`, then initialize the local development database:

```bash
npm run db:migrate
npm run db:seed
```

Create the first administrator without saving a password in the repository or shell history:

```bash
export ADMIN_EMAIL="admin@example.test"
export ADMIN_NAME="Local administrator"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run admin:create
unset ADMIN_PASSWORD
```

Passwords must be at least 12 characters. No default administrator exists. Start the app at [http://127.0.0.1:3000](http://127.0.0.1:3000):

```bash
npm run dev
```

## Docker Compose

Copy `.env.example` to `.env`, replace `BETTER_AUTH_SECRET`, and set `BETTER_AUTH_URL` to the public origin before production use.

```bash
docker compose up --build -d app
```

The app applies committed migrations at startup but does not seed production automatically. To intentionally add the fictional missing-only samples:

```bash
docker compose --profile tools run --rm \
  -e ALLOW_PRODUCTION_SEED=true manager npm run db:seed
```

Create an administrator through the short-lived management container:

```bash
export ADMIN_EMAIL="admin@example.test"
read -s ADMIN_PASSWORD
export ADMIN_PASSWORD
docker compose --profile tools run --rm \
  -e ADMIN_EMAIL -e ADMIN_PASSWORD manager npm run admin:create
unset ADMIN_PASSWORD
```

The running app uses Next.js standalone output, so development and peer-only toolchains are absent from the runtime image. The separate `manager` profile contains the TypeScript tooling required for deliberate migration, seed, and account-management commands and does not run as a service.

See [Operations](docs/operations.md) for migration review, volume backup, restore, and environment separation.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

The end-to-end suite creates and removes only `data/e2e.sqlite*`, starts a local test server, verifies anonymous admin protection and authenticated persistence, and exercises the public catalogue on desktop and mobile Chrome.

## Data safety

- `data/`, `uploads/`, environment files, backups, and SQLite sidecar files are ignored by Git and Docker build context.
- The repository contains only fictional `example.com` samples.
- Development/test files and production Docker volumes use independent paths.
- Seeding is insert-only and requires an explicit production opt-in; it never updates an existing row.
- Every admin mutation checks the server session and administrator role before writing.
- Migrations are generated as reviewable SQL and are never generated automatically at application startup.

![Tool detail and external sources](docs/screenshots/tool-detail-desktop.png)
