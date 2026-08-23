-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the anti-join alone finds the orphans
-- concept: sql.model.keys
-- expect:
-- A-2
-- A-4
SELECT order_ref FROM staged_orders s
WHERE s.customer_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = s.customer_id)
ORDER BY order_ref;

-- test: SQLite stores what you give it — the staging table has no types
-- concept: sql.model.types
-- expect:
-- 250|text
-- lots|text
SELECT amount, typeof(amount) FROM staged_orders
WHERE order_ref IN ('A-1', 'A-3') ORDER BY order_ref;

-- test: a numeric string survives the cast round trip; a word does not
-- concept: sql.model.types
-- expect:
-- 250|250
-- lots|0
SELECT amount, CAST(amount AS INTEGER) FROM staged_orders
WHERE order_ref IN ('A-1', 'A-3') ORDER BY order_ref;

-- test: the duplicate group, found by grouping on the would-be key
-- concept: sql.model.normalization
-- expect:
-- A-2|2
SELECT order_ref, COUNT(*) FROM staged_orders
GROUP BY order_ref HAVING COUNT(*) > 1;
