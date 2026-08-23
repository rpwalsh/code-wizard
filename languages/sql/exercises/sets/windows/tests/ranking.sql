-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the top two per region, ties sharing a place
-- concept: sql.sets.window
-- uses: main.sql
-- expect:
-- north|ada|500|1
-- north|bo|500|1
-- north|cy|300|2
-- south|eve|900|1
-- south|fay|400|2

-- test: dense_rank ties without skipping
-- concept: sql.sets.window
-- expect:
-- 500|1
-- 500|1
-- 300|2
-- 100|3
SELECT amount, DENSE_RANK() OVER (ORDER BY amount DESC)
FROM sales WHERE region = 'north' ORDER BY amount DESC, seller;

-- test: rank skips, which is the wrong answer here
-- concept: sql.sets.window
-- expect:
-- 500|1
-- 500|1
-- 300|3
-- 100|4
SELECT amount, RANK() OVER (ORDER BY amount DESC)
FROM sales WHERE region = 'north' ORDER BY amount DESC, seller;
