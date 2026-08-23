-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the average the comparison is against
-- concept: sql.sets.subqueries
-- expect:
-- 550.0
WITH team_totals AS (
  SELECT team, SUM(amount) AS total FROM expenses GROUP BY team
)
SELECT AVG(total) FROM team_totals;

-- test: the same question as a correlated subquery
-- concept: sql.sets.subqueries
-- expect:
-- mobile|50
SELECT team, MIN(amount) FROM expenses e
WHERE amount = (SELECT MIN(amount) FROM expenses)
GROUP BY team;

-- test: a scalar subquery in the select list
-- concept: sql.sets.subqueries
-- expect:
-- 7|1650
SELECT COUNT(*), (SELECT SUM(amount) FROM expenses) FROM expenses;
