# Fund Management

## User accounts and access

Administrators manage accounts from **Settings → User Accounts & Access Control**. New accounts receive a username, an initial password of at least 12 characters, and one of these roles:

- **Admin** — full access, including account and system settings and all user activity logs.
- **Editor** and **Viewer** — can create, edit, and delete operational records, but cannot access System Setup, manage accounts, or view the audit log.

Successful record changes, uncovered API write actions, login/logout events, failed logins, and denied administrator-only requests are recorded with the acting username. Only Admins can open **Activity Logs**.

Administrators can change the administrator password in **Settings → Change System User Password**. Each account password is stored as a salted hash in the local SQLite database at `data/Fund_vault_v7.sqlite3`. Use the existing administrator credentials when opening an already configured installation.

## Deploy the frontend on Vercel

The Vercel site hosts the Vite frontend; it does not run this Express API or provide persistent storage for the SQLite database. Deploy the API separately with a persistent disk:

1. In Render, create a Blueprint from this repository and approve the `render.yaml` service. The service uses a persistent disk mounted at `/var/data` for the SQLite database and backups.
2. Copy the deployed API's base URL from Render (for example, `https://fund-management-api.onrender.com`).
3. In the Vercel project's **Settings → Environment Variables**, set `VITE_API_URL` to that base URL for Production (without a trailing slash), then redeploy the frontend.
4. If your Vercel domain differs from `https://fdr360.vercel.app`, update `CORS_ORIGINS` on the Render service to the exact frontend origin (scheme and hostname, no path), then redeploy the API.

The Render disk keeps new records and backups between service restarts. The database on the Codespace or a user's PC is separate; import an existing SQLite database into `/var/data/Fund_vault_v7.sqlite3` before first use if its records should be used in production. Do not deploy with an empty database if the existing records must be preserved.
