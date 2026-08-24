# PrimeFlow UX tidy-up — local notes

This pass focused on real user-facing gaps: broken links, forms that dropped data, cropped logos, cramped mobile nav, and a reliable way to run the app on your machine. Nothing has been pushed to git.

## How to test locally

From the project root (`PRIMLAST`):

```bash
npm run dev
```

That starts both processes:

- **API** — `http://localhost:5000` (`server`: `npm run dev`)
- **UI** — `http://localhost:5173` (`client`: Vite, proxied to the API)

Open **http://localhost:5173** in the browser.

If you prefer two terminals:

```bash
npm run dev:server
npm run dev:client
```

First-time setup (if `node_modules` is missing):

```bash
cd server && npm install
cd ../client && npm install
```

### Demo accounts (seeded SQLite)

| Role | Email | Password |
| --- | --- | --- |
| Client | `client@primeflow.com` | `client123` |
| Admin | `admin@primeflow.com` | `admin123` |
| Operations | `ops@primeflow.com` | `ops123` |
| Compliance | `compliance@primeflow.com` | `compliance123` |

Phone on LAN: the Vite proxy forwards `/api` and `/uploads` to port 5000, so you can use the Network URL Vite prints (e.g. `http://192.168.x.x:5173`) instead of hitting `localhost` on the phone.

## What changed

### Landing page
- **Why Us** now scrolls to the features section (`#why-us`). That link was dead.
- Mobile menu includes **Sign In** and **Get Started**. Desktop Sign In / Get Started hide on small screens so the bar does not overflow.
- Consultation form sends a pre-filled **WhatsApp** message (no longer discards the fields and only opens register).
- Second support line listed: **+234 706 671 4961** (WhatsApp). Primary helpline remains **+234 707 292 8256**.
- Legal links open an in-page modal instead of `alert()`, and Terms now say **NRS** (not FIRS).
- Removed the US **IRS** trust badge; **NRS** remains.
- Logos use `object-fit: contain` so the mark is not cropped.

### Auth & app shell
- Auth modal scrolls on short screens; **Escape** closes it.
- Register/reset require **8+ character** passwords with a visible hint.
- Removed a large unreachable duplicate login layout from `App.tsx`.
- Admin notification title now shows the real application id (it was rendering the literal `${appId}`).
- Profile photos resolve correctly through `/api` (no doubled `/api/api/...` URL).
- Profile modal sits above other popups.

### Header, sidebar, WhatsApp
- Header search still jumps to the matching service/compliance tab.
- User name hides on tablet/phone; mail/notification dropdowns stay on-screen.
- **Logout** sits in the sidebar footer instead of under Dashboard.
- Floating WhatsApp button uses **+234 706 671 4961**. Drag still works; a click without a drag opens chat.

### Services & compliance
- TIN labels/errors say **NRS**, not FIRS.
- NSITF “Fix with Primeflow” uses the dedicated NSITF WhatsApp script.
- Survey submit shows an error if the API call fails.

### Local API wiring
- Vite proxies `/api` and `/uploads` to `localhost:5000`.
- Client `API_BASE` defaults to `/api` so LAN testing works without setting `VITE_API_URL`.

## Suggested click-through

1. Landing: Why Us, Contact form (WhatsApp), legal modals, Sign In / register on mobile width.
2. Login as `client@primeflow.com` / `client123`.
3. Home search / header search: `SCUML`, `Driver's Licence`.
4. Profile (header avatar): client can change photo only.
5. Services wizard: Next/Previous, State/LGA, directors, 5-file / 5MB limits if you have test files.
6. Compliance: NSITF WhatsApp link.
7. Resize to phone width: hamburger, stacked forms, logos not clipped.

## Intentionally not in this pass

- No git commit or push.
- Full certified-document / email-delivery product spec in `PROMPT.md` is still a larger build, not a tidy-up.
- Browser visual QA was not run in Cursor (no browser tool in this session); please walk the list above on `localhost:5173`.
