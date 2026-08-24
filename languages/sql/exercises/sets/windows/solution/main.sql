-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- region, day, amount, running_total, rank_in_region
--
-- PARTITION BY restarts the window at every region, which is what makes a
-- running total per region rather than one long total across all of them.
--
-- DENSE_RANK rather than RANK: ties share a rank and the next value follows
-- immediately, so two regions tied for first are both 1 and the next is 2
-- rather than 3.
SELECT region,
       day,
       amount,
       SUM(amount) OVER (
           PARTITION BY region
           ORDER BY day
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total,
       DENSE_RANK() OVER (
           PARTITION BY region
           ORDER BY amount DESC
       ) AS rank_in_region
FROM sales
ORDER BY region, day;
