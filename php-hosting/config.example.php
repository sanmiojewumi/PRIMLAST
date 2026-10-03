<?php
/**
 * Copy to config.php on the server (never commit real passwords).
 * Bluehost: cPanel → MySQL Databases → create DB + user, then fill these in.
 */
return [
    'db_host' => 'localhost',
    'db_name' => 'primeflow',
    'db_user' => 'primeflow',
    'db_pass' => 'change_me',
    'db_charset' => 'utf8mb4',
    'jwt_secret' => 'primeflow_super_secure_jwt_secret_key_2026_abuja',
    'jwt_ttl' => 86400,
    'uploads_dir' => __DIR__ . '/public/uploads',
];
