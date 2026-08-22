#!/usr/bin/env node
/** Run Electron against the Vite dev server, for UI work with hot reload. */
import { spawn } from 'node:child_process';

const server = process.env.CODE_RETRAINER_DEV_SERVER ?? 'http://localhost:5173';

const electron = spawn('npx', ['electron', '.'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CODE_RETRAINER_DEV_SERVER: server },
});

electron.on('exit', (code) => process.exit(code ?? 0));
