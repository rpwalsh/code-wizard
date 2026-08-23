-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- The three-valued logic underneath the query, shown directly.
-- These probe the data rather than the answer: they are the facts the
-- answer depends on, and each one is a rule people learn by being bitten.

-- test: nothing equals NULL, not even NULL
-- concept: sql.query.nulls
-- expect:
-- 0
SELECT COUNT(*) FROM readings WHERE celsius = NULL;

-- test: IS NULL is the only test that finds them
-- concept: sql.query.nulls
-- expect:
-- 3
SELECT COUNT(*) FROM readings WHERE celsius IS NULL;

-- test: NOT IN against a list containing NULL matches nothing at all
-- concept: sql.query.nulls
-- expect:
-- 0
SELECT COUNT(*) FROM readings
WHERE celsius NOT IN (SELECT celsius FROM readings WHERE sensor = 'b');

-- test: the same subquery with IN behaves as expected when values exist
-- concept: sql.query.nulls
-- expect:
-- 3
SELECT COUNT(*) FROM readings
WHERE celsius IN (SELECT celsius FROM readings WHERE sensor = 'c');

-- test: summing nothing is NULL, not zero
-- concept: sql.query.nulls
-- expect:
--
SELECT SUM(celsius) FROM readings WHERE sensor = 'b';

-- test: COUNT(*) counts rows and COUNT(column) counts values
-- concept: sql.query.nulls
-- expect:
-- 2|0
SELECT COUNT(*), COUNT(celsius) FROM readings WHERE sensor = 'b';
