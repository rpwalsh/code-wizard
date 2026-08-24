-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- DENSE_RANK, because ties share a place and the next is not skipped.
-- The CTE exists because WHERE runs before the window function, so `place`
-- does not exist yet at that point and cannot be filtered on.
WITH ranked AS (
  SELECT
    region,
    seller,
    amount,
    DENSE_RANK() OVER (PARTITION BY region ORDER BY amount DESC) AS place
  FROM sales
)
SELECT region, seller, amount, place
FROM ranked
WHERE place <= 2
ORDER BY region, place, seller;
