# CardThings operations

This guide covers the persistent state used by an independent CardThings installation. It does not add credential grants, deployment configuration, or a hosted environment.

## Environment separation

Local development defaults to `data/dev.sqlite`. Playwright uses `data/e2e.sqlite` and `uploads/e2e`, and recreates only the scoped database file. Docker uses `/app/data/cardthings.sqlite` inside the `cardthings-data` named volume. Avatars persist under `UPLOAD_DIR/avatars` in the separate uploads volume, while the user's existing image field stores the application URL. Back up both data and uploads together.

## Avatars and profile administration

Avatar selection accepts PNG, JPEG, or WebP up to 8 MiB, 8192 pixels per side, and 16,777,216 total pixels. The editor provides square cropping, zoom, and positioning before exporting a 512×512 PNG. The upload endpoint limits the exported file to 2 MiB, verifies and re-encodes it on the server, and writes a new random filename. Only the authenticated owner or an administrator can read the current avatar. Replaced files remain on disk for recovery, but their old URLs no longer serve them.

Administrators can edit ordinary users' names, email addresses, and avatars and reset their passwords. User IDs and roles are not editable through these endpoints; administrator targets are rejected. A changed email address becomes unverified, and changing email or resetting the password revokes that user's existing sessions. Password resets require at least 12 characters and use the existing password hashing implementation.

Mutation requests require the exact public origin configured by `BETTER_AUTH_URL`; keep it aligned with the external URL when running behind a proxy.

Never point development or test commands at a production database. Keep each production deployment on its own volume names by setting `CARDTHINGS_DATA_VOLUME` and `CARDTHINGS_UPLOADS_VOLUME` in the deployment's uncommitted `.env` file.

## Initialize a new installation

Creating a database requires an explicit command:

```bash
npm run db:migrate -- --initialize
```

For a new Docker installation, initialize the configured named volume before starting the app:

```bash
docker compose --profile tools run --rm manager npm run db:migrate -- --initialize
docker compose up --build -d app
```

Normal runtime connections and migrations require an existing database file. If a database or mount disappears, startup fails instead of silently creating an empty database. Check the configured path and recover the existing state; do not use `--initialize` as a recovery command. Explicit in-memory databases remain available for isolated builds and tests.

## Migrations

Username uniqueness is enforced by a unique index on `lower(trim(name))`. Surrounding spaces and ASCII letter case do not distinguish usernames; SQLite's native `lower()` leaves other Unicode characters unchanged. Registration and profile updates also validate names on the server. Before upgrading an existing installation, check for conflicting names:

```sql
SELECT lower(trim(name)) AS username, count(*) AS count
FROM user
GROUP BY lower(trim(name))
HAVING count(*) > 1;
```

Resolve any conflicts deliberately before applying the migration. It refuses conflicting data and never renames or deletes existing users automatically.

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

## Test fixtures

Production and development have no seed command. Before deleting files or running migrations, the Playwright server loads environment configuration and requires `CARDTHINGS_TEST_SEED=true`, a database path resolving to `data/e2e.sqlite`, and an upload directory resolving to `uploads/e2e`. It then recreates only `data/e2e.sqlite*`, explicitly initializes that test database, and runs `scripts/seed-test.ts` with a second test-only guard. Both guards reject every other database path. Run the suite through `npm run test:e2e`; do not point it at an established installation.

Create production categories, optional tags, cards, optional image URLs, and related links through `/admin`. New installations have no collection records or bundled collection artwork. Card records are read from SQLite; there is no deployment-specific catalogue file imported at startup.

Card image URLs may refer to an external HTTP(S) image or a same-site absolute path. Administrators control these values. Image files belong to the deployment: persist and back up any locally hosted image directory separately from the framework checkout. The framework does not download or copy card images during save. Explicit card images preserve their aspect ratio and bypass automatic icon discovery. Software-specific optional fields can remain blank for books, bookmarks, and other subjects.

## Secrets and administrators

- Generate `BETTER_AUTH_SECRET` independently for every environment.
- Never commit `.env`, real administrator passwords, real mirror URLs, or private catalogue content. The optional local demo credentials documented in the README are intentionally non-secret.
- Create production administrators with explicit `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables. The separate `demo:create` command creates only the two documented local demo accounts and requires a loopback `BETTER_AUTH_URL`.
- `admin:create` refuses to replace an existing account and never prints the password.
- Remove sensitive shell variables after the management command finishes.

## Framework and deployment separation

The current trees of `main` and `dev` contain only the collection-neutral framework. Preserve their existing published commits and IDs; add framework extraction and maintenance work as new commits. Legacy history still contains the former deployment files and artwork, and removing those files from the current tree does not erase historical copies. `dev` is the experimental base for new features and may temporarily lead the stable `main` branch. Real categories, tags, cards, artwork, account records, environment settings, and private backups belong to each independent installation and must not be added to future code commits. Schemas, migrations, shared interface assets, and isolated synthetic test fixtures remain version-controlled.

Squash focused feature branches into `dev` after review. After checks and explicit owner approval, fast-forward `main` to the tested `dev` commit; do not squash the same development history again for release. Align both branches at release and mark the stable code commit with a version tag.

A code branch or image records application versions, not the live database contents. To reproduce an installation, restore its reviewed database and file backups and configure its own environment. Keep those backups outside the public framework repository.
