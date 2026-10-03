<?php

$configFile = dirname(__DIR__) . '/config.php';
if (!is_file($configFile)) {
    $configFile = dirname(__DIR__) . '/config.example.php';
}
$GLOBALS['PF_CONFIG'] = require $configFile;

require __DIR__ . '/Jwt.php';
require __DIR__ . '/Database.php';
require __DIR__ . '/Http.php';
require __DIR__ . '/Dispatcher.php';

$uploads = $GLOBALS['PF_CONFIG']['uploads_dir'];
if (!is_dir($uploads)) {
    @mkdir($uploads, 0755, true);
}

Http::cors();
if (Http::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}
