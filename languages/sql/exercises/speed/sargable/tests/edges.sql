-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the index the range can use exists
-- concept: sql.speed.indexes
-- expect:
-- idx_orders_placed
SELECT name FROM sqlite_master
WHERE type = 'index' AND tbl_name = 'orders' AND name = 'idx_orders_placed';

-- test: case-blind matching needs a case-blind strategy, not lower() at query time
-- concept: sql.speed.sargable
-- expect:
-- bo|80
-- Bo|90
SELECT customer, total FROM orders
WHERE customer = 'bo' COLLATE NOCASE
ORDER BY placed_at;
