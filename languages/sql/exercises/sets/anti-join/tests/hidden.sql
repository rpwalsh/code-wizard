-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: a canceled order still counts as having ordered
-- concept: sql.sets.joins
-- uses: main.sql
-- expect:
-- Barbara
-- Linus

-- test: the result is exactly two rows
-- concept: sql.sets.aggregates
-- expect:
-- 2
SELECT COUNT(*) FROM (
  SELECT c.name
  FROM customers c
  LEFT JOIN orders o ON o.customer_id = c.id
  WHERE o.id IS NULL
);
