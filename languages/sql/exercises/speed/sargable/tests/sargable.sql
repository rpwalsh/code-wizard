-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the March orders, in date order
-- concept: sql.speed.sargable
-- uses: main.sql
-- expect:
-- 2|ada|2026-03-01|250
-- 3|bo|2026-03-05|80
-- 4|Bo|2026-03-14|90
-- 7|dee|2026-03-20|40
-- 5|cy|2026-03-31|300

-- test: the boundary days land on the right sides
-- concept: sql.speed.sargable
-- expect:
-- 2026-02-27|0
-- 2026-03-01|1
-- 2026-04-01|0
SELECT placed_at,
       CASE WHEN placed_at >= '2026-03-01' AND placed_at < '2026-04-01' THEN 1 ELSE 0 END
FROM orders WHERE placed_at IN ('2026-02-27', '2026-03-01', '2026-04-01')
ORDER BY placed_at;
