-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the interrupted transfer, found by its arithmetic
-- concept: sql.change.transactions
-- uses: main.sql
-- expect:
-- 3|-20

-- test: complete transfers sum to zero
-- concept: sql.change.transactions
-- expect:
-- 1|0
-- 2|0
-- 4|0
SELECT transfer_id, SUM(delta) FROM movements
GROUP BY transfer_id HAVING SUM(delta) = 0 ORDER BY transfer_id;
