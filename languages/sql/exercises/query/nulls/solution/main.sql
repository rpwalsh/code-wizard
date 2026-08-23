-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Per sensor: sensor, total, measured, missing, average.
--
-- COUNT(*) counts rows; COUNT(celsius) counts rows where celsius is not
-- null. The difference between them is the number of times the sensor was
-- offline, which is why no CASE expression is needed to find it.
--
-- AVG ignores nulls rather than treating them as zero, so a sensor that
-- reported nothing at all has an average of NULL — not 0, which would be a
-- reading it never took.
SELECT sensor,
       COUNT(*)                     AS total,
       COUNT(celsius)               AS measured,
       COUNT(*) - COUNT(celsius)    AS missing,
       ROUND(AVG(celsius), 1)       AS average
FROM readings
GROUP BY sensor
ORDER BY sensor;
