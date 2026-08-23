-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the untouched row stays untouched
-- concept: sql.change.upsert
-- expect:
-- locale|en-US|0
SELECT key, value, updates FROM settings WHERE key = 'locale';

-- test: DO NOTHING is the other conflict answer — no row, no error
-- concept: sql.change.upsert
-- expect:
INSERT INTO settings (key, value) VALUES ('theme', 'ignored')
ON CONFLICT (key) DO NOTHING
RETURNING key;

-- test: excluded refers to the row that failed to insert
-- concept: sql.change.upsert
-- expect:
-- theme|proposed
INSERT INTO settings (key, value) VALUES ('theme', 'proposed')
ON CONFLICT (key) DO UPDATE SET value = excluded.value
RETURNING key, value;
