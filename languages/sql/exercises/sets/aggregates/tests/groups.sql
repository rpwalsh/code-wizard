-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: two qualifying customers, biggest spender first
-- concept: sql.sets.aggregates
-- uses: main.sql
-- expect:
-- bo|3|730
-- ada|2|450

-- test: the total ignores the orders WHERE excluded
-- concept: sql.sets.aggregates
-- expect:
-- 450
SELECT SUM(amount) FROM orders WHERE customer = 'ada' AND amount > 100;

-- test: one big order is not enough
-- concept: sql.sets.having
-- expect:
-- cy|1
SELECT customer, COUNT(*) FROM orders
WHERE amount > 100 AND customer = 'cy'
GROUP BY customer;
