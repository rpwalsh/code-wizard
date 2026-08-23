-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the existing key updates in place and counts it
-- concept: sql.change.upsert
-- uses: main.sql
-- expect:
-- theme|light|3

-- test: a fresh key inserts with the default count
-- concept: sql.change.insert
-- expect:
-- retries|5|0
INSERT INTO settings (key, value)
VALUES ('retries', '5')
ON CONFLICT (key) DO UPDATE SET value = excluded.value, updates = updates + 1
RETURNING key, value, updates;

-- test: a plain insert on an existing key is a constraint violation, not an update
-- concept: sql.change.insert
-- expect:
-- 1
SELECT COUNT(*) FROM settings WHERE key = 'theme';
