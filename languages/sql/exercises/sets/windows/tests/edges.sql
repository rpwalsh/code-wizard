-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: a window function keeps every row where an aggregate would not
-- concept: sql.sets.aggregates
-- expect:
-- 6
SELECT COUNT(*) FROM (
  SELECT seller, SUM(amount) OVER (PARTITION BY region) FROM sales
);

-- test: the aggregate collapses to one row per region
-- concept: sql.sets.aggregates
-- expect:
-- 2
SELECT COUNT(*) FROM (
  SELECT region, SUM(amount) FROM sales GROUP BY region
);

-- test: a region with one seller still ranks
-- concept: sql.sets.window
-- expect:
-- solo|1
SELECT seller, DENSE_RANK() OVER (PARTITION BY region ORDER BY amount DESC)
FROM (SELECT 'west' AS region, 'solo' AS seller, 5 AS amount);
