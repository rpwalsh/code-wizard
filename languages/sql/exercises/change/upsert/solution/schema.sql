-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updates INTEGER NOT NULL DEFAULT 0
);

INSERT INTO settings (key, value, updates) VALUES
  ('theme', 'dark', 2),
  ('locale', 'en-US', 0);
