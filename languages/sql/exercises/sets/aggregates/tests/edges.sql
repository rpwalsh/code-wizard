-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: COUNT(*) counts rows, COUNT(column) skips NULLs
-- concept: sql.query.nulls
-- expect:
-- 11|8
SELECT COUNT(*), COUNT(shipped_at) FROM orders;

-- test: a customer with only small orders forms no group at all
-- concept: sql.sets.having
-- expect:
-- 0
SELECT COUNT(*) FROM (
  SELECT customer FROM orders
  WHERE amount > 100
  GROUP BY customer
  HAVING COUNT(*) >= 2
) WHERE customer = 'dee';

-- test: the threshold is exclusive on both sides of the boundary
-- concept: sql.sets.aggregates
-- expect:
-- 100|0
-- 101|1
SELECT amount, CASE WHEN amount > 100 THEN 1 ELSE 0 END
FROM orders WHERE amount IN (100, 101) ORDER BY amount;

-- test: aggregates skip NULL but the rows still count
-- concept: sql.query.nulls
-- expect:
-- ada|3|2
SELECT customer, COUNT(*), COUNT(shipped_at)
FROM orders WHERE customer = 'ada' GROUP BY customer;
