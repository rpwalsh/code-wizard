-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: a comparison with NULL is not true, so IS NULL needs its own arm
-- concept: sql.query.nulls
-- expect:
-- 0
SELECT COUNT(*) FROM submissions WHERE score >= 0 AND student = 'dee';

-- test: every boundary score lands on the inclusive side
-- concept: sql.query.expressions
-- expect:
-- 50|C
-- 70|B
-- 85|A
SELECT score,
       CASE
         WHEN score IS NULL THEN 'pending'
         WHEN score >= 85 THEN 'A'
         WHEN score >= 70 THEN 'B'
         WHEN score >= 50 THEN 'C'
         ELSE 'F'
       END
FROM submissions WHERE score IN (85, 70, 50) ORDER BY score;

-- test: one below each boundary drops a grade
-- concept: sql.query.expressions
-- expect:
-- 45|F
-- 67|C
-- 84|B
SELECT score,
       CASE
         WHEN score IS NULL THEN 'pending'
         WHEN score >= 85 THEN 'A'
         WHEN score >= 70 THEN 'B'
         WHEN score >= 50 THEN 'C'
         ELSE 'F'
       END
FROM submissions WHERE score IN (84, 67, 45) ORDER BY score;

-- test: selecting and filtering still works underneath the CASE
-- concept: sql.query.select
-- expect:
-- ada
-- cy
-- gus
SELECT student FROM submissions WHERE score >= 80 ORDER BY student;
