-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: a customer whose only order has a NULL total still counts as ordering
-- concept: sql.query.nulls
-- uses: main.sql
-- expect:
-- Barbara
-- Linus

-- test: equality against NULL is never true
-- concept: sql.query.nulls
-- expect:
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id = NULL
ORDER BY c.name;

-- test: the join itself keeps every customer
-- concept: sql.sets.joins
-- expect:
-- 4
SELECT COUNT(DISTINCT c.id)
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
