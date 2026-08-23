-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- The CTE names the intermediate result, and the outer query reads like the
-- sentence it came from: totals per team, keep those above the average of
-- those totals. The same logic as nested subqueries, minus the nesting.

WITH team_totals AS (
  SELECT team, SUM(amount) AS total
  FROM expenses
  GROUP BY team
)
SELECT team, total
FROM team_totals
WHERE total > (SELECT AVG(total) FROM team_totals)
ORDER BY total DESC;
