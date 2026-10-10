# CardThings operations

This guide covers the persistent state used by the first CardThings milestone. It does not add credential grants, deployment configuration, or a hosted environment.

## Environment separation

Local development defaults to `data/dev.sqlite`. Playwright uses `data/e2e.sqlite` and recreates only that scoped file. Docker uses `/app/data/cardthings.sqlite` inside the `cardthings-data` named volume. Upload storage is reserved in the separate `cardthings-uploads` volume; uploads are not implemented in this milestone.

Never point development or test commands at a production database. Keep each production deployment on its own volume names by setting `CARDTHINGS_DATA_VOLUME` and `CARDTHINGS_UPLOADS_VOLUME` in the deployment's uncommitted `.env` file.

## Migrations

Schema changes are deliberate:

1. Change `src/db/schema.ts` on a task branch.
2. Run `npm run db:generate`.
3. Review the generated SQL under `drizzle/`, including destructive statements and data transforms.
4. Back up the target volume.
5. Apply locally with `npm run db:migrate`, then run the full verification suite.
6. Deploy the reviewed migration. The container applies committed migrations before starting Next.js.

Do not run `drizzle-kit push` against production.

## Backup Docker volumes

Stop writes before copying SQLite and upload state:

```bash
mkdir -p backups
docker compose stop app
docker run --rm \
  -v cardthings-data:/source:ro \
  -v "$PWD/backups:/backup" \
  alpine:3.21 tar -czf /backup/cardthings-data-<timestamp>.tgz -C /source .
docker run --rm \
  -v cardthings-uploads:/source:ro \
  -v "$PWD/backups:/backup" \
  alpine:3.21 tar -czf /backup/cardthings-uploads-<timestamp>.tgz -C /source .
docker compose start app
```

Replace `<timestamp>` with a sortable UTC value such as `20261009T210000Z`. If custom volume names are configured, use those exact names. Backups are ignored by Git; move them to an access-controlled backup system and test restores regularly.

## Restore without overwriting the current volume

Restore into a new volume first so the current production state remains recoverable:

```bash
docker compose stop app
docker volume create cardthings-data-restored-20261009
docker run --rm \
  -v cardthings-data-restored-20261009:/target \
  -v "$PWD/backups:/backup:ro" \
  alpine:3.21 tar -xzf /backup/cardthings-data-<timestamp>.tgz -C /target
```

Set `CARDTHINGS_DATA_VOLUME=cardthings-data-restored-20261009` in the uncommitted deployment `.env`, start the app, and verify login, catalogue pages, and a representative admin edit. Keep the previous volume until acceptance. Restore uploads into a separate new volume with the same pattern.

## Seed behavior

`npm run db:seed` uses stable identifiers plus conflict-ignore inserts. It adds missing fictional samples and does not update existing content. In `NODE_ENV=production`, the command refuses to run unless `ALLOW_PRODUCTION_SEED=true` is explicitly supplied.

Production does not require sample data. An administrator can create categories, tags, tools, and external sources through `/admin` instead.

## Secrets and administrators

- Generate `BETTER_AUTH_SECRET` independently for every environment.
- Never commit `.env`, administrator passwords, real mirror URLs, or private catalogue content.
- The first administrator is created only with explicit `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables.
- `admin:create` refuses to replace an existing account and never prints the password.
- Remove sensitive shell variables after the management command finishes.

## Isolated Demo preview

The optional Demo gateway is a review boundary, not production authentication. It binds to `127.0.0.1:3311`, forwards only GET and HEAD requests for the public catalogue, tool details, visitor Demo, isolated administrator Demo, and Next.js assets, and rejects `/admin`, `/api`, unknown paths, encoded traversal, and every write method. It removes request credentials and upstream `Set-Cookie` headers and adds no-index response headers.

Start it against an already running local app:

```bash
DEMO_GATEWAY_TARGET=http://127.0.0.1:3000 \
DEMO_GATEWAY_TTL_MS=7200000 \
npm run demo:gateway
```

The process closes after the TTL or immediately on `Ctrl-C`. A temporary HTTPS tunnel, if separately approved, must target only `127.0.0.1:3311`. Never tunnel the application port, mount a host directory or Docker socket into a tunnel container, or put real credentials, private URLs, or non-fictional data in the Demo.

Each visitor's ordinary-user and administrator Demo changes live only in that tab's `sessionStorage`. Closing the tab clears them. The isolated administrator persona cannot call management APIs, read SQLite, create sessions, or enter the real `/admin` workspace.
