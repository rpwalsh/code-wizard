-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the qualifying customers, biggest spender first
-- concept: sql.sets.aggregates
-- uses: main.sql
-- expect:
-- cy|2|1001
-- bo|3|730
-- ada|2|450

-- test: the total ignores the orders WHERE excluded
-- concept: sql.sets.aggregates
-- expect:
-- 450
SELECT SUM(amount) FROM orders WHERE customer = 'ada' AND amount > 100;

-- test: an order of exactly 100 is not over 100
-- concept: sql.sets.having
-- expect:
-- 2
SELECT COUNT(*) FROM orders WHERE customer = 'cy' AND amount > 100;
