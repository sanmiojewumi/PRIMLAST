# PrimeFlow — project map (resume here)

Two tracks, **same GitHub repo** (`sanmiojewumi/PRIMLAST`, also pushed to `PRIMEE`):

| What you say | Branch | Host |
|---|---|---|
| Current / Node / Vercel app | `main` | Vercel + Express + SQLite |
| **Web-language / Bluehost version** | **`primeflow-php-mysql`** | Bluehost Apache + **PHP** + **MySQL** |

Do not merge `primeflow-php-mysql` into `main` unless you explicitly want that.

---

## Product flow (both tracks)

1. **Public landing** (`LandingPage`) — no login. Hero, services, regulators, guides/FAQs, AI advisor, **Get in Touch** form (`#consultation`). WhatsApp `+234 707 292 8256`.
2. **Auth modal** — register (OTP), login, reset. JWT in `localStorage` (`primeflow_token` / `primeflow_user`). Idle logout 10 minutes.
3. **Client portal** — Home, file a service (`ServicesPortal` + signatures), documents, chat, compliance, billing, profile.
4. **Staff portal** — Kanban, admin users/logs, client chat search, workflow tracker, billing generate/pay, mailbox.
5. **API contract** — React uses `API_BASE` default **`/api`**. Paths: `/auth/*`, `/services/*`, `/documents/*`, `/messages/*`, `/admin/*`, `/compliance/*`, `/billing/*`, `/workflow/*`, `/health`, `/uploads/*`.

Roles: `client`, `operations_officer`, `compliance_officer`, `admin`, `supervisor`.

---

## `main` structure (do not lose this)

```
client/                 Vite + React UI (source of truth for screens)
  src/App.tsx           Shell: landing if logged out, portal if logged in
  src/components/       LandingPage, Kanban, ChatRoom, AdminPortal, …
  src/context/AuthContext.tsx
server/src/             Express API + SQLite (server/primeflow.db)
  routes/*.ts           auth, services, documents, messages, admin, compliance, billing, workflow
api/index.ts            Vercel function wrapper
vercel.json             Rewrites /api → function, SPA → index.html
```

Local: `npm run dev` → UI `http://localhost:5174`, API `:5000`.

---

## `primeflow-php-mysql` structure (Bluehost)

```
php-hosting/
  public/               ← upload to public_html
    .htaccess           /api/* → PHP; else SPA index.html
    api/index.php
    index.html          Replaced by client/dist when you run pack.mjs
    uploads/
  src/                  PHP: bootstrap, Database, Jwt, Http, Dispatcher
  sql/schema.mysql.sql
  config.example.php    Copy to config.php (DB + jwt_secret)
  pack.mjs              Builds React and copies dist into public/
  README.md
```

UI: **same React codebase** as `main` (built to static HTML/JS). Backend: PHP PDO + MySQL, same JSON/JWT shape so the UI does not change.

Seed users on empty DB: admin / ops / compliance / client (same emails as Node seed).

---

## How to pick up next time

- **Node/Vercel:** `git checkout main`
- **Bluehost PHP:** `git checkout primeflow-php-mysql` then work under `php-hosting/`
- Deploy PHP: import SQL → `config.php` → `node php-hosting/pack.mjs` → upload `php-hosting/public/`
- JWT secret must match `config.php` (`jwt_secret`). Keep it aligned with Node’s `JWT_SECRET` if you ever share tokens (you normally will not).

Last setup: branch created **2026-10-04**. Node app on `main` remains the live Vercel line.
