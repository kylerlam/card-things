# CardThings

CardThings is a self-hosted catalogue for curated, link-based collections. Visitors browse public cards and dedicated detail pages; authenticated users manage their account; administrators manage cards, categories, tags, publication state, and external download sources.

CardThings stores descriptions and links, not installer binaries. Official and mirror files remain with their external providers.

![CardThings public catalogue](docs/screenshots/catalogue-desktop.png)

## Features

- Public catalogue with text, category, and Tag discovery
- Published-only detail routes with version, installation, source, licence, episode, and download metadata
- Explicit official or mirror source labels; every download opens the external provider
- Real email/password registration, login, session, profile-name, and password management
- Server-authorized administrator access and tool, category, and tag CRUD
- Draft and published tool states
- SQLite migrations, persistent Docker volumes, and documented backup/restore procedures
- Protected administrator overview, user listing, tool, category, tag, and profile pages

Favourites are intentionally deferred and are not shown in the current interface.

## Routes

- `/` — public catalogue, search, category filters, and tool cards
- `/tools/:slug` — published card details and external download sources
- `/auth` — real user login and registration
- `/user` — authenticated account overview and profile security
- `/admin/login` — real administrator authentication; there is no default password
- `/admin` — role-protected administration workspace

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

Production and development databases start without catalogue samples. Create categories, optional tags, cards, and external download links through `/admin`.

## Docker Compose

Copy `.env.example` to `.env`, replace `BETTER_AUTH_SECRET`, and set `BETTER_AUTH_URL` to the public origin before production use.

```bash
docker compose up --build -d app
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

The running app uses Next.js standalone output, so development and peer-only toolchains are absent from the runtime image. The separate `manager` profile contains the TypeScript tooling required for deliberate migration and account-management commands and does not run as a service.

See [Operations](docs/operations.md) for migration review, volume backup, restore, and environment separation.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

The end-to-end suite recreates only `data/e2e.sqlite*`. Its catalogue records and credentials live under test-only code and cannot be seeded into the development or production database through a package script.

## Data safety

- `data/`, `uploads/`, environment files, backups, and SQLite sidecar files are ignored by Git and Docker build context.
- Development, test, and production files use independent paths.
- No production seed command or default credential exists.
- Every administrator mutation checks the server session and administrator role before writing.
- Migrations are generated as reviewable SQL and are never generated automatically at application startup.
