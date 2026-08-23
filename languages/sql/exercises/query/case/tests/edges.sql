-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: a comparison with NULL is not true, so IS NULL needs its own arm
-- concept: sql.query.nulls
-- expect:
-- 0
SELECT COUNT(*) FROM submissions WHERE score >= 0 AND student = 'dee';

-- test: the boundary values land on the right side
-- concept: sql.query.expressions
-- expect:
-- 70|B
SELECT score, CASE WHEN score >= 85 THEN 'A' WHEN score >= 70 THEN 'B' ELSE 'other' END
FROM submissions WHERE student = 'fay';

-- test: selecting and filtering still works underneath the CASE
-- concept: sql.query.select
-- expect:
-- ada
-- cy
SELECT student FROM submissions WHERE score >= 80 ORDER BY student;
