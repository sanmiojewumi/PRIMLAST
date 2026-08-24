import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(name, cwd, command) {
  console.log(`Starting ${name}: ${command}`);
  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: 'inherit',
    env: process.env
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });
  return child;
}

const server = run('API', path.join(root, 'server'), 'npm run dev');
const client = run('UI', path.join(root, 'client'), 'npm run dev');

function shutdown() {
  server.kill();
  client.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
