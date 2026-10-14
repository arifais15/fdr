# Fund Management

## User accounts and access

Administrators manage accounts from **Settings → User Accounts & Access Control**. New accounts receive a username, an initial password of at least 12 characters, and one of these roles:

- **Admin** — full access, including account and system settings and all user activity logs.
- **Editor** and **Viewer** — can create, edit, and delete operational records, but cannot access System Setup, manage accounts, or view the audit log.

Successful record changes, uncovered API write actions, login/logout events, failed logins, and denied administrator-only requests are recorded with the acting username. Only Admins can open **Activity Logs**.

Administrators can change the administrator password in **Settings → Change System User Password**. Each account password is stored as a salted hash in the local SQLite database at `data/Fund_vault_v7.sqlite3`. Use the existing administrator credentials when opening an already configured installation.
