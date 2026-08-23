-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- The clean schema, with its constraints...
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE
);

-- ...and the import staging table, which has none. Rows arrived here from
-- a CSV, and the query's job is to find what the constraints would refuse.
CREATE TABLE staged_orders (
  order_ref TEXT,
  customer_id INTEGER,
  amount TEXT
);

INSERT INTO customers (id, email) VALUES
  (1, 'ada@example.com'),
  (2, 'bo@example.com');

INSERT INTO staged_orders (order_ref, customer_id, amount) VALUES
  ('A-1', 1, '250'),
  ('A-2', 9, '100'),      -- customer 9 does not exist
  ('A-3', 2, 'lots'),     -- not a number
  ('A-2', 1, '75'),       -- duplicate reference
  ('A-4', NULL, '60'),    -- no customer at all
  ('A-5', 2, '90');
