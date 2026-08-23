#!/usr/bin/env node
// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
/** Run Electron against the Vite dev server, for UI work with hot reload. */
import { spawn } from 'node:child_process';

const server = process.env.CODE_RETRAINER_DEV_SERVER ?? 'http://localhost:5173';

const electron = spawn('npx', ['electron', '.'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CODE_RETRAINER_DEV_SERVER: server },
});

electron.on('exit', (code) => process.exit(code ?? 0));
