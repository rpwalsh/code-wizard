-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- Daily sales per region. Deliberately uneven: one region joins late, and
-- one day is missing entirely, so a running total has something to say.
CREATE TABLE sales (
    region TEXT NOT NULL,
    day    TEXT NOT NULL,
    amount INTEGER NOT NULL
);

INSERT INTO sales (region, day, amount) VALUES
    ('north', '2026-03-01', 100),
    ('north', '2026-03-02', 50),
    ('north', '2026-03-04', 70),
    ('south', '2026-03-01', 300),
    ('south', '2026-03-02', 20),
    ('south', '2026-03-03', 180),
    ('west',  '2026-03-03', 45);
