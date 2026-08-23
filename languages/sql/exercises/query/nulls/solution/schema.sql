-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Temperature readings from three sensors. A sensor that was offline
-- recorded a row with no value, which is not the same as a reading of zero.
--
-- The values are deliberately awkward: the averages do not land on a tidy
-- decimal, so a report rounded to the wrong precision is visibly wrong
-- rather than accidentally right.
CREATE TABLE readings (
    sensor   TEXT NOT NULL,
    taken_at TEXT NOT NULL,
    celsius  REAL
);

INSERT INTO readings (sensor, taken_at, celsius) VALUES
    ('a', '2026-01-01T00:00', 20),
    ('a', '2026-01-01T01:00', 21),
    ('a', '2026-01-01T02:00', 23),
    ('a', '2026-01-01T03:00', NULL),
    ('b', '2026-01-01T00:00', NULL),
    ('b', '2026-01-01T01:00', NULL),
    ('c', '2026-01-01T00:00', 15),
    ('c', '2026-01-01T01:00', 17),
    ('c', '2026-01-01T02:00', 22);
