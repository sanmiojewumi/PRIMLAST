<?php

class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo) return self::$pdo;
        $c = $GLOBALS['PF_CONFIG'];
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $c['db_host'], $c['db_name'], $c['db_charset']);
        self::$pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        self::seedIfEmpty();
        return self::$pdo;
    }

    public static function one(string $sql, array $params = []): ?array
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        $row = $st->fetch();
        return $row ?: null;
    }

    public static function all(string $sql, array $params = []): array
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        return $st->fetchAll();
    }

    public static function run(string $sql, array $params = []): int
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        return (int) self::pdo()->lastInsertId();
    }

    public static function exec(string $sql, array $params = []): int
    {
        $st = self::pdo()->prepare($sql);
        $st->execute($params);
        return $st->rowCount();
    }

    private static function seedIfEmpty(): void
    {
        $n = (int) self::pdo()->query('SELECT COUNT(*) FROM users')->fetchColumn();
        if ($n > 0) return;
        $users = [
            ['System Administrator', 'admin@primeflow.com', 'admin123', 'admin'],
            ['Fatima Ibrahim', 'ops@primeflow.com', 'ops123', 'operations_officer'],
            ['Chinedu Okafor', 'compliance@primeflow.com', 'compliance123', 'compliance_officer'],
            ['Babajide Sowande', 'client@primeflow.com', 'client123', 'client'],
        ];
        $ins = self::pdo()->prepare('INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)');
        $prof = self::pdo()->prepare('INSERT INTO profiles (user_id, phone, company_name, address, profile_bio) VALUES (?,?,?,?,?)');
        foreach ($users as $u) {
            $ins->execute([$u[0], $u[1], password_hash($u[2], PASSWORD_BCRYPT), $u[3], 'active']);
            $id = (int) self::pdo()->lastInsertId();
            $prof->execute([$id, '', '', '', '']);
        }
    }
}
