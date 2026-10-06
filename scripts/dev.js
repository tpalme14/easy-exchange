import { spawn } from 'node:child_process';

const processes = [
  spawn('npm', ['run', 'dev', '--workspace=server'], {
    stdio: 'inherit',
    shell: true
  }),
  spawn('npm', ['run', 'dev', '--workspace=client'], {
    stdio: 'inherit',
    shell: true
  })
];

function shutdown() {
  for (const child of processes) {
    child.kill();
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
