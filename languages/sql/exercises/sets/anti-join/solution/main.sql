-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Every customer, joined to their orders; the ones where nothing matched
-- have NULL in every `orders` column, and the key is the column that says so.
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name;
