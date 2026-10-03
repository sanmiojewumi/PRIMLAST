# PrimeFlow on Bluehost (PHP + MySQL)

Upload **`php-hosting/public/`** to Bluehost `public_html`.

1. Create a MySQL database and user in cPanel.
2. Copy `config.example.php` → `php-hosting/config.php` and set DB credentials (place `config.php` **one level above** `public/`, or edit `src/bootstrap.php` if you put everything in `public_html`).
3. Import `sql/schema.mysql.sql` in phpMyAdmin.
4. From the repo: `node php-hosting/pack.mjs` (builds the existing React UI into `public/`).
5. Upload `public/` contents. Keep `.htaccess` and the `api/` folder.
6. Point the domain at `public_html`. Open `/api/health`.

Demo logins (seeded on first empty DB): `admin@primeflow.com` / `admin123`, `client@primeflow.com` / `client123`.

The React app still calls `/api/...`. Apache sends those to PHP. UI/UX is the same build as `main`.
