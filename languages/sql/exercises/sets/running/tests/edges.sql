-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- What a window does that GROUP BY cannot, and where the partition matters.

-- test: a window keeps every row where GROUP BY collapses them
-- concept: sql.sets.window
-- expect:
-- 7
SELECT COUNT(*) FROM (SELECT region, SUM(amount) OVER (PARTITION BY region) FROM sales);

-- test: grouping the same data leaves one row per region
-- concept: sql.sets.aggregates
-- expect:
-- north|220
-- south|500
-- west|45
SELECT region, SUM(amount) FROM sales GROUP BY region ORDER BY region;

-- test: without PARTITION BY the running total runs across every region
-- concept: sql.sets.window
-- expect:
-- north|400
-- south|400
-- north|470
-- south|470
-- south|695
-- west|695
-- north|765
SELECT region, SUM(amount) OVER (ORDER BY day) FROM sales ORDER BY day, region;

-- test: RANK leaves a gap after a tie and DENSE_RANK does not
-- concept: sql.sets.window
-- expect:
-- 100|1|1
-- 100|1|1
-- 50|3|2
SELECT amount,
       RANK() OVER (ORDER BY amount DESC) AS r,
       DENSE_RANK() OVER (ORDER BY amount DESC) AS d
FROM (SELECT 100 AS amount UNION ALL SELECT 100 UNION ALL SELECT 50)
ORDER BY amount DESC;
