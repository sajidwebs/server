# Render deployment

The API creates missing model tables and foreign keys before listening. Existing
tables and data are preserved, and missing model columns are added transactionally.
A schema mismatch stops startup with an error;
legacy databases require a reviewed migration rather than destructive sync.

## Backend

1. Deploy `https://github.com/sajidwebs/server` as a Node web service on `main`.
   Leave Render's Root Directory blank: this repository contains the backend.
2. Build command: `npm ci`. Start command: `npm start`. Health check: `/health`.
3. Set `NODE_ENV=production`, `JWT_EXPIRE=7d`, and a newly generated `JWT_SECRET`.
4. Set `DATABASE_URL` to Render's Internal Database URL when the services share
   a region (`DB_SSL=false`). For an external URL use `DB_SSL=true`.
   Alternatively use `DB_HOST`, `DB_PORT=5432`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
   Remove an obsolete DATABASE_URL if using separate DB variables.
5. Deploy the latest commit. Verify `/health` returns `{"status":"ok"}`.
6. On a new database, set temporary `ADMIN_EMAIL` and `ADMIN_PASSWORD` (12+
   characters), then run `npm run admin:create` in the Render service shell.
   Remove these temporary variables afterward. Existing admin passwords are unchanged.

Do not run demo seed scripts against production. Moving local business records
requires a separate backup/restore.

## Admin portal (separate service)

Deploy the admin portal repository as a Render Static Site. Build:
`npm ci && npm run build`; publish directory: `dist`. Set
`VITE_API_URL=https://YOUR-API.onrender.com/api` before building. Add a rewrite
from `/*` to `/index.html`. Redeploy whenever the API URL changes. Sign in using
the administrator created above.

## Credentials

Rotate the database password and JWT secret previously shared or committed.
Environment files are excluded from Git; configure secrets in Render only.
Removing a file from the current commit does not remove it from Git history.
