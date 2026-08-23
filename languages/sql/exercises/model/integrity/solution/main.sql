-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Each UNION arm is one constraint written as a query: the anti-join is a
-- missing foreign key, the CAST round-trip is a type check, and the
-- self-group is a uniqueness check. What a constraint would refuse
-- automatically, a staging table has to hunt down by hand — which is the
-- argument for constraints.

SELECT order_ref, 'orphan customer' AS problem
FROM staged_orders s
WHERE customer_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = s.customer_id)

UNION ALL

SELECT order_ref, 'bad amount'
FROM staged_orders
-- The round trip must come *back*: casting to INTEGER and back to TEXT
-- reproduces a numeric string exactly and turns 'lots' into '0'. Comparing
-- against amount + 0 would not work — + does the same lossy coercion CAST
-- does, so both sides of that comparison lie in unison.
WHERE CAST(CAST(amount AS INTEGER) AS TEXT) IS NOT amount
   OR amount IS NULL

UNION ALL

SELECT order_ref, 'duplicate reference'
FROM staged_orders
WHERE order_ref IN (
  SELECT order_ref FROM staged_orders GROUP BY order_ref HAVING COUNT(*) > 1
)

ORDER BY order_ref, problem;
