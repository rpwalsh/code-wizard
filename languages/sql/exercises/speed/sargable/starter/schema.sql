-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer TEXT NOT NULL,
  placed_at TEXT NOT NULL,   -- ISO dates: '2026-03-14'
  total INTEGER NOT NULL
);

CREATE INDEX idx_orders_placed ON orders (placed_at);
CREATE INDEX idx_orders_customer ON orders (customer);

INSERT INTO orders (customer, placed_at, total) VALUES
  ('ada', '2026-02-27', 120),
  ('ada', '2026-03-01', 250),
  ('bo',  '2026-03-05', 80),
  ('Bo',  '2026-03-14', 90),
  ('cy',  '2026-03-31', 300),
  ('ada', '2026-04-01', 150),
  ('dee', '2026-03-20', 40);
