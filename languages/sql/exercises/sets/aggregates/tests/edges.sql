-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: COUNT(*) counts rows, COUNT(column) skips NULLs
-- concept: sql.query.nulls
-- expect:
-- 9|6
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

-- test: aggregates skip NULL but the rows still count
-- concept: sql.query.nulls
-- expect:
-- ada|3|2
SELECT customer, COUNT(*), COUNT(shipped_at)
FROM orders WHERE customer = 'ada' GROUP BY customer;
