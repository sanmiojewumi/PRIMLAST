import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'client', 'dist');
const dest = path.join(root, 'php-hosting', 'public');

const build = spawnSync('npm', ['run', 'build'], { cwd: path.join(root, 'client'), stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status || 1);

for (const name of fs.readdirSync(dist)) {
  if (name === 'api') continue;
  const from = path.join(dist, name);
  const to = path.join(dest, name);
  fs.cpSync(from, to, { recursive: true });
}

console.log('Copied client/dist → php-hosting/public (api/ and .htaccess kept).');
