-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Every staged row that the real schema would refuse: order_ref, problem.
-- problem is one of 'orphan customer', 'bad amount', 'duplicate reference'.
-- A row with several problems is reported once per problem.
-- Ordered by order_ref, then problem.

SELECT 'not implemented' AS order_ref;
