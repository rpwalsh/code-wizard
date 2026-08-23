-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE orders (
  customer TEXT NOT NULL,
  amount INTEGER NOT NULL,
  shipped_at TEXT
);

INSERT INTO orders (customer, amount, shipped_at) VALUES
  ('ada', 150, '2026-01-05'),
  ('ada', 300, NULL),
  ('ada',  40, '2026-01-07'),
  ('bo',  500, '2026-02-01'),
  ('bo',  120, NULL),
  ('bo',  110, '2026-02-11'),
  ('cy',  900, '2026-03-01'),
  -- Exactly on the threshold and exactly one past it: without this pair,
  -- > 100 and >= 100 select the same rows and the boundary is untested.
  ('cy',  100, '2026-03-05'),
  ('cy',  101, '2026-03-06'),
  ('dee',  90, '2026-03-02'),
  ('dee',  80, NULL);
