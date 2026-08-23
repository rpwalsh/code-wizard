-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- CASE evaluates arms top to bottom and takes the first true one, so the
-- NULL arm comes first — every comparison with NULL is unknown, which is
-- never true, and without its own arm 'pending' students would all be 'F'.

SELECT student,
       score,
       CASE
         WHEN score IS NULL THEN 'pending'
         WHEN score >= 85 THEN 'A'
         WHEN score >= 70 THEN 'B'
         WHEN score >= 50 THEN 'C'
         ELSE 'F'
       END AS grade
FROM submissions
ORDER BY student;
