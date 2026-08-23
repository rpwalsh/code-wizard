-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- A range on the bare column. strftime('%m', placed_at) = '03' asks the
-- same question and forces a full scan: wrapping the column in a function
-- hides it from its own index, because the index stores placed_at, not
-- strftime of it.

SELECT id, customer, placed_at, total
FROM orders
WHERE placed_at >= '2026-03-01'
  AND placed_at < '2026-04-01'
ORDER BY placed_at, id;
