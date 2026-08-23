-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- ON CONFLICT names the key that decides between the two outcomes, and
-- excluded.value is the row that failed to insert — which is how the update
-- half reuses the insert half's values instead of repeating them.

INSERT INTO settings (key, value)
VALUES ('theme', 'light')
ON CONFLICT (key) DO UPDATE SET
  value = excluded.value,
  updates = updates + 1
RETURNING key, value, updates;
