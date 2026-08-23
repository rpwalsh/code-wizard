-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Customers with at least two orders over 100: customer, big_orders, total.
-- The row condition lives in WHERE; the group condition can only live in
-- HAVING, because the count does not exist until the rows are grouped.

SELECT customer,
       COUNT(*) AS big_orders,
       SUM(amount) AS total
FROM orders
WHERE amount > 100
GROUP BY customer
HAVING COUNT(*) >= 2
ORDER BY total DESC, customer;
