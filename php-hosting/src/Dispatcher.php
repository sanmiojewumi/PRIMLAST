<?php

class Dispatcher
{
    private static ?array $user = null;

    public static function handle(): void
    {
        $method = Http::method();
        $path = rtrim(Http::path(), '/') ?: '/';
        $path = preg_replace('#^/api#', '', $path) ?: $path;
        if ($path[0] !== '/') $path = '/' . $path;

        try {
            if ($path === '/' || $path === '/health') {
                Http::json(['status' => 'healthy', 'timestamp' => date('c'), 'engine' => 'php-mysql']);
            }

            if (strpos($path, '/auth') === 0) {
                self::auth($method, substr($path, 5) ?: '/');
            }
            if (strpos($path, '/services') === 0) {
                self::services($method, substr($path, 9) ?: '/');
            }
            if (strpos($path, '/documents') === 0) {
                self::documents($method, substr($path, 10) ?: '/');
            }
            if (strpos($path, '/messages') === 0) {
                self::messages($method, substr($path, 9) ?: '/');
            }
            if (strpos($path, '/admin') === 0) {
                self::admin($method, substr($path, 6) ?: '/');
            }
            if (strpos($path, '/compliance') === 0) {
                self::compliance($method, substr($path, 11) ?: '/');
            }
            if (strpos($path, '/billing') === 0) {
                self::billing($method, substr($path, 8) ?: '/');
            }
            if (strpos($path, '/workflow') === 0) {
                self::workflow($method, substr($path, 9) ?: '/');
            }

            Http::json(['error' => "Endpoint $method $path not found"], 404);
        } catch (Throwable $e) {
            Http::json(['error' => $e->getMessage() ?: 'Internal server error'], 500);
        }
    }

    private static function auth(string $m, string $p): void
    {
        $p = $p ?: '/';
        $b = Http::body();
        $cfg = $GLOBALS['PF_CONFIG'];

        if ($m === 'POST' && $p === '/login') {
            $email = trim($b['email'] ?? '');
            $password = $b['password'] ?? '';
            if (!$email || !$password) Http::json(['error' => 'Email and password are required'], 400);
            $user = Database::one('SELECT id, name, email, password_hash, role, status, permissions FROM users WHERE email = ?', [$email]);
            if (!$user || !password_verify($password, $user['password_hash'])) {
                self::audit(null, 'LOGIN_FAILED', "Failed login for $email");
                Http::json(['error' => 'Invalid email or password'], 401);
            }
            if ($user['status'] !== 'active') Http::json(['error' => 'Your account is suspended or pending approval'], 403);
            $perms = self::parseJson($user['permissions']);
            $token = Jwt::sign([
                'id' => (int) $user['id'],
                'email' => $user['email'],
                'role' => $user['role'],
                'name' => $user['name'],
                'permissions' => $user['permissions'],
            ], $cfg['jwt_secret'], (int) $cfg['jwt_ttl']);
            self::audit((int) $user['id'], 'LOGIN_SUCCESS', 'User successfully authenticated');
            Http::json([
                'token' => $token,
                'user' => [
                    'id' => (int) $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'permissions' => $perms,
                ],
            ]);
        }

        if ($m === 'POST' && $p === '/register-request') {
            foreach (['name', 'email', 'password', 'phone'] as $k) {
                if (empty($b[$k])) Http::json(['error' => 'Name, email, password, and phone number are required'], 400);
            }
            if (strlen($b['password']) < 8) Http::json(['error' => 'Password must be at least 8 characters long'], 400);
            if (Database::one('SELECT id FROM users WHERE email = ?', [$b['email']])) {
                Http::json(['error' => 'User with this email already exists'], 409);
            }
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            Database::exec('REPLACE INTO verification_codes (email, code, name, password_hash, phone) VALUES (?,?,?,?,?)', [
                $b['email'], $code, $b['name'], password_hash($b['password'], PASSWORD_BCRYPT), $b['phone'],
            ]);
            Http::json(['ok' => true, 'message' => 'Verification code sent', 'devCode' => $code]);
        }

        if ($m === 'POST' && $p === '/register-verify') {
            $email = $b['email'] ?? '';
            $code = $b['code'] ?? '';
            $row = Database::one('SELECT * FROM verification_codes WHERE email = ?', [$email]);
            if (!$row || $row['code'] !== $code) Http::json(['error' => 'Invalid verification code'], 400);
            Database::run('INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)', [
                $row['name'], $row['email'], $row['password_hash'], 'client', 'active',
            ]);
            $id = (int) Database::pdo()->lastInsertId();
            Database::run('INSERT INTO profiles (user_id, phone, company_name, address, profile_bio) VALUES (?,?,?,?,?)', [$id, $row['phone'], '', '', '']);
            Database::exec('DELETE FROM verification_codes WHERE email = ?', [$email]);
            $token = Jwt::sign(['id' => $id, 'email' => $row['email'], 'role' => 'client', 'name' => $row['name']], $cfg['jwt_secret'], (int) $cfg['jwt_ttl']);
            Http::json(['token' => $token, 'user' => ['id' => $id, 'name' => $row['name'], 'email' => $row['email'], 'role' => 'client']], 201);
        }

        if ($m === 'POST' && $p === '/register') {
            if (empty($b['name']) || empty($b['email']) || empty($b['password'])) {
                Http::json(['error' => 'Name, email, and password are required'], 400);
            }
            if (Database::one('SELECT id FROM users WHERE email = ?', [$b['email']])) {
                Http::json(['error' => 'User with this email already exists'], 409);
            }
            Database::run('INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)', [
                $b['name'], $b['email'], password_hash($b['password'], PASSWORD_BCRYPT), 'client', 'active',
            ]);
            $id = (int) Database::pdo()->lastInsertId();
            Database::run('INSERT INTO profiles (user_id, phone, company_name, address, profile_bio) VALUES (?,?,?,?,?)', [$id, '', '', '', '']);
            $token = Jwt::sign(['id' => $id, 'email' => $b['email'], 'role' => 'client', 'name' => $b['name']], $cfg['jwt_secret'], (int) $cfg['jwt_ttl']);
            Http::json(['token' => $token, 'user' => ['id' => $id, 'name' => $b['name'], 'email' => $b['email'], 'role' => 'client']], 201);
        }

        if ($m === 'POST' && $p === '/reset-password') {
            if (empty($b['email']) || empty($b['newPassword'])) Http::json(['error' => 'Email and new password are required'], 400);
            if (strlen($b['newPassword']) < 8) Http::json(['error' => 'Password must be at least 8 characters long'], 400);
            $user = Database::one('SELECT id FROM users WHERE email = ?', [$b['email']]);
            if ($user) {
                Database::exec('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($b['newPassword'], PASSWORD_BCRYPT), $user['id']]);
            }
            Http::json(['message' => 'If the account exists, the password has been updated']);
        }

        if ($m === 'GET' && $p === '/me') {
            $u = self::requireUser();
            $row = Database::one('SELECT id, name, email, role, status, permissions, created_at FROM users WHERE id = ?', [$u['id']]);
            if ($row) $row['permissions'] = self::parseJson($row['permissions']);
            Http::json($row);
        }

        if (preg_match('#^/profile/(\d+)$#', $p, $mm)) {
            $u = self::requireUser();
            $uid = (int) $mm[1];
            if ($m === 'GET') {
                $user = Database::one('SELECT id, name, email, role, status FROM users WHERE id = ?', [$uid]);
                $profile = Database::one('SELECT * FROM profiles WHERE user_id = ?', [$uid]) ?: [];
                Http::json(['user' => $user, 'profile' => $profile]);
            }
            if ($m === 'POST') {
                if ((int) $u['id'] !== $uid && !self::isStaff($u['role'])) Http::json(['error' => 'Forbidden'], 403);
                Database::exec(
                    'INSERT INTO profiles (user_id, phone, company_name, address, profile_bio, state, lga) VALUES (?,?,?,?,?,?,?)
                     ON DUPLICATE KEY UPDATE phone=VALUES(phone), company_name=VALUES(company_name), address=VALUES(address), profile_bio=VALUES(profile_bio), state=VALUES(state), lga=VALUES(lga)',
                    [$uid, $b['phone'] ?? '', $b['company_name'] ?? '', $b['address'] ?? '', $b['profile_bio'] ?? '', $b['state'] ?? '', $b['lga'] ?? '']
                );
                if (!empty($b['name'])) Database::exec('UPDATE users SET name = ? WHERE id = ?', [$b['name'], $uid]);
                Http::json(['ok' => true]);
            }
        }

        if (preg_match('#^/profile/(\d+)/avatar$#', $p, $mm) && $m === 'POST') {
            self::requireUser();
            Http::json(['error' => 'Upload avatar via multipart to this endpoint after configuring PHP file uploads'], 501);
        }

        Http::json(['error' => "Endpoint $m /auth$p not found"], 404);
    }

    private static function services(string $m, string $p): void
    {
        $p = $p ?: '/';
        $u = self::requireUser();
        $b = Http::body();

        if ($m === 'GET' && $p === '/applications') {
            if ($u['role'] === 'client') {
                Http::json(Database::all('SELECT * FROM applications WHERE client_id = ? ORDER BY created_at DESC', [$u['id']]));
            }
            Http::json(Database::all('SELECT a.*, u.name AS client_name FROM applications a LEFT JOIN users u ON u.id = a.client_id ORDER BY a.created_at DESC'));
        }

        if ($m === 'GET' && preg_match('#^/applications/(\d+)$#', $p, $mm)) {
            $row = Database::one('SELECT * FROM applications WHERE id = ?', [(int) $mm[1]]);
            if (!$row) Http::json(['error' => 'Not found'], 404);
            if ($u['role'] === 'client' && (int) $row['client_id'] !== (int) $u['id']) Http::json(['error' => 'Forbidden'], 403);
            Http::json($row);
        }

        if ($m === 'POST' && $p === '/applications') {
            self::requireRole($u, ['client']);
            $type = $b['service_type'] ?? '';
            $details = is_string($b['details'] ?? null) ? $b['details'] : json_encode($b['details'] ?? new stdClass());
            if (!$type || !$details) Http::json(['error' => 'service_type and details are required'], 400);
            $id = Database::run('INSERT INTO applications (client_id, service_type, status, details) VALUES (?,?,?,?)', [$u['id'], $type, 'submitted', $details]);
            self::audit((int) $u['id'], 'APPLICATION_SUBMITTED', "Application #$id ($type)");
            Http::json(['id' => $id, 'status' => 'submitted'], 201);
        }

        if ($m === 'PUT' && preg_match('#^/applications/(\d+)/status$#', $p, $mm)) {
            self::requireStaff($u);
            $id = (int) $mm[1];
            $status = $b['status'] ?? '';
            Database::exec('UPDATE applications SET status = ? WHERE id = ?', [$status, $id]);
            self::audit((int) $u['id'], 'STATUS_UPDATE', "Application #$id -> $status");
            Http::json(['ok' => true]);
        }

        if ($m === 'PUT' && preg_match('#^/applications/(\d+)/assign$#', $p, $mm)) {
            self::requireStaff($u);
            Database::exec('UPDATE applications SET assigned_to = ? WHERE id = ?', [$b['assigned_to'] ?? null, (int) $mm[1]]);
            Http::json(['ok' => true]);
        }

        if ($m === 'DELETE' && preg_match('#^/applications/(\d+)/incomplete$#', $p, $mm)) {
            $id = (int) $mm[1];
            $row = Database::one('SELECT * FROM applications WHERE id = ?', [$id]);
            if (!$row) Http::json(['error' => 'Not found'], 404);
            if ($u['role'] === 'client' && (int) $row['client_id'] !== (int) $u['id']) Http::json(['error' => 'Forbidden'], 403);
            Database::exec('DELETE FROM applications WHERE id = ?', [$id]);
            Http::json(['ok' => true]);
        }

        if ($m === 'GET' && $p === '/notifications') {
            Http::json(Database::all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100', [$u['id']]));
        }

        if ($m === 'GET' && $p === '/unread-summary') {
            $n = Database::one('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0', [$u['id']]);
            Http::json(['unread' => (int) ($n['c'] ?? 0)]);
        }

        if ($m === 'POST' && $p === '/survey') {
            Http::json(['ok' => true]);
        }

        if ($m === 'GET' && $p === '/mock-mailbox') {
            self::requireStaff($u);
            Http::json([]);
        }

        Http::json(['error' => "Endpoint $m /services$p not found"], 404);
    }

    private static function documents(string $m, string $p): void
    {
        $u = self::requireUser();
        $b = Http::body();
        $p = $p ?: '/';

        if ($m === 'POST' && $p === '/upload') {
            if (empty($_FILES['file'])) Http::json(['error' => 'No file uploaded'], 400);
            $appId = (int) ($_POST['application_id'] ?? $b['application_id'] ?? 0);
            $f = $_FILES['file'];
            $safe = bin2hex(random_bytes(8)) . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $f['name']);
            $dest = rtrim($GLOBALS['PF_CONFIG']['uploads_dir'], '/\\') . DIRECTORY_SEPARATOR . $safe;
            if (!move_uploaded_file($f['tmp_name'], $dest)) Http::json(['error' => 'Upload failed'], 500);
            $id = Database::run(
                'INSERT INTO documents (application_id, user_id, filename, original_name, mime_type, size) VALUES (?,?,?,?,?,?)',
                [$appId, $u['id'], $safe, $f['name'], $f['type'] ?: 'application/octet-stream', (int) $f['size']]
            );
            Http::json(['id' => $id, 'filename' => $safe, 'url' => '/uploads/' . $safe], 201);
        }

        if ($m === 'GET' && preg_match('#^/application/(\d+)$#', $p, $mm)) {
            Http::json(Database::all('SELECT * FROM documents WHERE application_id = ? ORDER BY created_at DESC', [(int) $mm[1]]));
        }

        if ($m === 'GET' && preg_match('#^/download/(\d+)$#', $p, $mm)) {
            $doc = Database::one('SELECT * FROM documents WHERE id = ?', [(int) $mm[1]]);
            if (!$doc) Http::json(['error' => 'Not found'], 404);
            $file = rtrim($GLOBALS['PF_CONFIG']['uploads_dir'], '/\\') . DIRECTORY_SEPARATOR . $doc['filename'];
            if (!is_file($file)) Http::json(['error' => 'File missing'], 404);
            header('Content-Type: ' . $doc['mime_type']);
            header('Content-Disposition: attachment; filename="' . $doc['original_name'] . '"');
            readfile($file);
            exit;
        }

        if ($m === 'PUT' && preg_match('#^/(\d+)/approve$#', $p, $mm)) {
            self::requireStaff($u);
            Database::exec('UPDATE documents SET is_approved = 1 WHERE id = ?', [(int) $mm[1]]);
            Http::json(['ok' => true]);
        }

        if ($m === 'POST' && $p === '/signature') {
            $appId = (int) ($b['application_id'] ?? 0);
            Database::run('INSERT INTO signatures (application_id, user_id, document_id) VALUES (?,?,?)', [$appId, $u['id'], $b['document_id'] ?? null]);
            Http::json(['ok' => true], 201);
        }

        Http::json(['error' => "Endpoint $m /documents$p not found"], 404);
    }

    private static function messages(string $m, string $p): void
    {
        $u = self::requireUser();
        $b = Http::body();
        $p = $p ?: '/';

        if ($m === 'GET' && ($p === '/' || $p === '/clients')) {
            self::requireStaff($u);
            $q = '%' . (isset($_GET['q']) ? $_GET['q'] : '') . '%';
            Http::json(Database::all(
                "SELECT id, name, email, role FROM users WHERE role = 'client' AND (name LIKE ? OR email LIKE ?) ORDER BY name LIMIT 50",
                array($q, $q)
            ));
        }

        if (($m === 'POST' || $m === 'PUT') && $p === '/open-client') {
            self::requireStaff($u);
            self::openClientChat($u, (int) ($b['client_id'] ?? 0));
        }

        if ($m === 'GET' && preg_match('#^/(\d+)$#', $p, $mm)) {
            $appId = (int) $mm[1];
            Http::json(Database::all('SELECT * FROM messages WHERE application_id = ? ORDER BY created_at ASC', [$appId]));
        }

        if ($m === 'POST' && $p === '/') {
            if (!empty($b['client_id']) && empty($b['application_id'])) {
                self::requireStaff($u);
                self::openClientChat($u, (int) $b['client_id']);
            }
            $appId = (int) ($b['application_id'] ?? 0);
            $text = trim($b['message_text'] ?? '');
            if (!$appId || ($text === '' && empty($b['file_url']))) {
                Http::json(['error' => 'Application ID and message text or file are required'], 400);
            }
            $app = Database::one('SELECT client_id, assigned_to FROM applications WHERE id = ?', [$appId]);
            if (!$app) Http::json(['error' => 'Application not found'], 404);
            $receiver = $u['role'] === 'client' ? ((int) ($app['assigned_to'] ?: 1)) : (int) $app['client_id'];
            $id = Database::run(
                'INSERT INTO messages (sender_id, receiver_id, application_id, message_text, file_url, filename) VALUES (?,?,?,?,?,?)',
                [$u['id'], $receiver, $appId, $text, $b['file_url'] ?? null, $b['filename'] ?? null]
            );
            Http::json(['id' => $id], 201);
        }

        Http::json(['error' => "Endpoint $m /messages$p not found"], 404);
    }

    private static function openClientChat(array $u, int $clientId): void
    {
        if (!$clientId) Http::json(['error' => 'client_id required'], 400);
        $app = Database::one(
            "SELECT id FROM applications WHERE client_id = ? ORDER BY updated_at DESC LIMIT 1",
            [$clientId]
        );
        if (!$app) {
            $id = Database::run(
                'INSERT INTO applications (client_id, service_type, status, details, assigned_to) VALUES (?,?,?,?,?)',
                [$clientId, 'other_services', 'pending', json_encode(['source' => 'chat']), $u['id']]
            );
            Http::json(['application_id' => $id, 'created' => true]);
        }
        Http::json(['application_id' => (int) $app['id'], 'created' => false]);
    }

    private static function admin(string $m, string $p): void
    {
        $u = self::requireUser();
        self::requireStaff($u);
        $p = $p ?: '/';
        $b = Http::body();

        if ($m === 'GET' && $p === '/stats') {
            Http::json([
                'users' => (int) Database::one('SELECT COUNT(*) AS c FROM users')['c'],
                'applications' => (int) Database::one('SELECT COUNT(*) AS c FROM applications')['c'],
                'pending' => (int) Database::one("SELECT COUNT(*) AS c FROM applications WHERE status NOT IN ('completed','rejected')")['c'],
            ]);
        }
        if ($m === 'GET' && $p === '/staff-directory') {
            Http::json(Database::all("SELECT id, name, email, role FROM users WHERE role != 'client' ORDER BY name"));
        }
        if ($m === 'GET' && $p === '/users') {
            $q = $_GET['q'] ?? '';
            if ($q !== '') {
                $like = "%$q%";
                Http::json(Database::all('SELECT id, name, email, role, status, created_at FROM users WHERE name LIKE ? OR email LIKE ? OR role LIKE ? ORDER BY created_at DESC', [$like, $like, $like]));
            }
            Http::json(Database::all('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'));
        }
        if ($m === 'GET' && $p === '/logs') {
            Http::json(Database::all('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200'));
        }
        if ($m === 'POST' && $p === '/users') {
            Database::run('INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)', [
                $b['name'], $b['email'], password_hash($b['password'] ?? 'ChangeMe123!', PASSWORD_BCRYPT), $b['role'] ?? 'operations_officer', 'active',
            ]);
            Http::json(['ok' => true], 201);
        }
        if ($m === 'PUT' && preg_match('#^/users/(\d+)/status$#', $p, $mm)) {
            Database::exec('UPDATE users SET status = ? WHERE id = ?', [$b['status'] ?? 'active', (int) $mm[1]]);
            Http::json(['ok' => true]);
        }
        if ($m === 'PUT' && preg_match('#^/users/(\d+)$#', $p, $mm)) {
            $sets = [];
            $vals = [];
            foreach (['name', 'email', 'role', 'status'] as $k) {
                if (isset($b[$k])) { $sets[] = "$k = ?"; $vals[] = $b[$k]; }
            }
            if (!empty($b['password'])) { $sets[] = 'password_hash = ?'; $vals[] = password_hash($b['password'], PASSWORD_BCRYPT); }
            $vals[] = (int) $mm[1];
            if ($sets) Database::exec('UPDATE users SET ' . implode(',', $sets) . ' WHERE id = ?', $vals);
            Http::json(['ok' => true]);
        }
        if ($m === 'DELETE' && preg_match('#^/users/(\d+)$#', $p, $mm)) {
            Database::exec('DELETE FROM users WHERE id = ?', [(int) $mm[1]]);
            Http::json(['ok' => true]);
        }
        if ($m === 'PUT' && preg_match('#^/applications/(\d+)$#', $p, $mm)) {
            if (isset($b['details'])) {
                $details = is_string($b['details']) ? $b['details'] : json_encode($b['details']);
                Database::exec('UPDATE applications SET details = ? WHERE id = ?', [$details, (int) $mm[1]]);
            }
            Http::json(['ok' => true]);
        }
        if ($m === 'DELETE' && preg_match('#^/applications/(\d+)$#', $p, $mm)) {
            Database::exec('DELETE FROM applications WHERE id = ?', [(int) $mm[1]]);
            Http::json(['ok' => true]);
        }
        Http::json(['error' => "Endpoint $m /admin$p not found"], 404);
    }

    private static function compliance(string $m, string $p): void
    {
        $u = self::requireUser();
        $p = $p ?: '/';
        $b = Http::body();
        if ($m === 'GET' && $p === '/') {
            $uid = self::isStaff($u['role']) ? (int) ($_GET['user_id'] ?? $u['id']) : (int) $u['id'];
            Http::json(Database::all('SELECT * FROM compliance_items WHERE user_id = ? ORDER BY updated_at DESC', [$uid]));
        }
        if ($m === 'POST' && $p === '/') {
            $id = Database::run(
                'INSERT INTO compliance_items (user_id, item_key, title, agency, status, due_date, details, priority) VALUES (?,?,?,?,?,?,?,?)',
                [$u['id'], $b['item_key'] ?? 'other', $b['title'] ?? '', $b['agency'] ?? '', $b['status'] ?? 'not_registered', $b['due_date'] ?? null, $b['details'] ?? '', $b['priority'] ?? 'medium']
            );
            Http::json(['id' => $id], 201);
        }
        Http::json(['error' => "Endpoint $m /compliance$p not found"], 404);
    }

    private static function billing(string $m, string $p): void
    {
        $u = self::requireUser();
        $p = $p ?: '/';
        $b = Http::body();
        if ($m === 'GET' && $p === '/fees') {
            Http::json(['business_name' => 35000, 'company' => 85000, 'annual_returns' => 30000]);
        }
        if ($m === 'GET' && $p === '/settings') {
            Http::json(Database::one('SELECT * FROM billing_settings WHERE id = 1') ?: []);
        }
        if ($m === 'PUT' && $p === '/settings') {
            self::requireStaff($u);
            Database::exec(
                'UPDATE billing_settings SET auto_invoice_on_complete=?, bank_name=?, bank_account_name=?, bank_account_number=?, gateway_enabled=?, paystack_public_key=? WHERE id=1',
                [
                    (int) ($b['auto_invoice_on_complete'] ?? 0),
                    $b['bank_name'] ?? null,
                    $b['bank_account_name'] ?? null,
                    $b['bank_account_number'] ?? null,
                    (int) ($b['gateway_enabled'] ?? 0),
                    $b['paystack_public_key'] ?? null,
                ]
            );
            Http::json(['ok' => true]);
        }
        if ($m === 'GET' && $p === '/invoices') {
            if ($u['role'] === 'client') {
                Http::json(Database::all('SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC', [$u['id']]));
            }
            Http::json(Database::all('SELECT * FROM invoices ORDER BY created_at DESC'));
        }
        if ($m === 'POST' && $p === '/generate') {
            self::requireStaff($u);
            $number = 'PF-' . date('Ymd') . '-' . random_int(1000, 9999);
            $id = Database::run(
                'INSERT INTO invoices (application_id, client_id, doc_type, generation_mode, number, amount, tax, description, issued_by) VALUES (?,?,?,?,?,?,?,?,?)',
                [$b['application_id'] ?? null, $b['client_id'], $b['doc_type'] ?? 'invoice', $b['generation_mode'] ?? 'manual', $number, $b['amount'] ?? 0, $b['tax'] ?? 0, $b['description'] ?? '', $u['id']]
            );
            Http::json(['id' => $id, 'number' => $number], 201);
        }
        if ($m === 'GET' && preg_match('#^/invoices/(\d+)$#', $p, $mm)) {
            Http::json(Database::one('SELECT * FROM invoices WHERE id = ?', [(int) $mm[1]]) ?: []);
        }
        if ($m === 'GET' && preg_match('#^/application/(\d+)$#', $p, $mm)) {
            Http::json(Database::all('SELECT * FROM invoices WHERE application_id = ?', [(int) $mm[1]]));
        }
        if ($m === 'POST' && in_array($p, ['/pay/bank', '/pay/initialize', '/pay/verify', '/pay/confirm'], true)) {
            Http::json(['ok' => true, 'status' => 'recorded']);
        }
        Http::json(['error' => "Endpoint $m /billing$p not found"], 404);
    }

    private static function workflow(string $m, string $p): void
    {
        $u = self::requireUser();
        self::requireStaff($u);
        $p = $p ?: '/';
        if ($m === 'GET' && $p === '/tracker') {
            Http::json([
                'period' => $_GET['period'] ?? 'month',
                'bucketLabel' => 'Current',
                'kpis' => [
                    'submissions' => (int) Database::one('SELECT COUNT(*) AS c FROM applications')['c'],
                    'completions' => (int) Database::one("SELECT COUNT(*) AS c FROM applications WHERE status = 'completed'")['c'],
                    'documents' => (int) Database::one('SELECT COUNT(*) AS c FROM documents')['c'],
                    'signatures' => (int) Database::one('SELECT COUNT(*) AS c FROM signatures')['c'],
                    'invoices' => (int) Database::one('SELECT COUNT(*) AS c FROM invoices')['c'],
                    'activities' => (int) Database::one('SELECT COUNT(*) AS c FROM audit_logs')['c'],
                ],
                'series' => ['submissions' => [], 'completions' => [], 'documents' => [], 'invoices' => []],
                'byStatus' => Database::all('SELECT status, COUNT(*) AS count FROM applications GROUP BY status'),
                'byService' => Database::all('SELECT service_type, COUNT(*) AS count FROM applications GROUP BY service_type'),
                'byAction' => Database::all('SELECT action, COUNT(*) AS count FROM audit_logs GROUP BY action ORDER BY count DESC LIMIT 10'),
                'recent' => Database::all('SELECT a.id, a.action, a.details, a.created_at, u.name AS user_name FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 20'),
            ]);
        }
        if ($m === 'GET' && $p === '/details') {
            Http::json(['items' => Database::all('SELECT * FROM applications ORDER BY updated_at DESC LIMIT 50')]);
        }
        if ($m === 'GET' && preg_match('#^/record/([^/]+)/(\d+)$#', $p, $mm)) {
            $type = $mm[1];
            $id = (int) $mm[2];
            $table = 'audit_logs';
            if (in_array($type, ['application', 'submissions', 'completions', 'status', 'service'], true)) $table = 'applications';
            elseif (in_array($type, ['document', 'documents'], true)) $table = 'documents';
            elseif (in_array($type, ['invoice', 'invoices'], true)) $table = 'invoices';
            Http::json(Database::one("SELECT * FROM $table WHERE id = ?", [$id]) ?: []);
        }
        Http::json(['error' => "Endpoint $m /workflow$p not found"], 404);
    }

    private static function requireUser(): array
    {
        if (self::$user) return self::$user;
        $token = Http::bearer();
        if (!$token) Http::json(['error' => 'Authorization header missing'], 401);
        $payload = Jwt::verify($token, $GLOBALS['PF_CONFIG']['jwt_secret']);
        if (!$payload) Http::json(['error' => 'Token is invalid or expired'], 403);
        self::$user = $payload;
        return self::$user;
    }

    private static function isStaff(string $role): bool
    {
        return in_array($role, ['admin', 'supervisor', 'operations_officer', 'compliance_officer'], true);
    }

    private static function requireStaff(array $u): void
    {
        if (!self::isStaff($u['role'] ?? '')) Http::json(['error' => 'Forbidden: Insufficient privileges for this operation'], 403);
    }

    private static function requireRole(array $u, array $roles): void
    {
        if (!in_array($u['role'] ?? '', $roles, true)) Http::json(['error' => 'Forbidden: Insufficient privileges for this operation'], 403);
    }

    private static function parseJson(?string $raw)
    {
        if (!$raw) return null;
        $j = json_decode($raw, true);
        return $j ?? $raw;
    }

    private static function audit(?int $userId, string $action, string $details): void
    {
        try {
            Database::run('INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?,?,?,?)', [
                $userId, $action, $details, $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            ]);
        } catch (Throwable $e) {
        }
    }
}
