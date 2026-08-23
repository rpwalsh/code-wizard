-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE customers (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers (id),
  total       INTEGER,
  status      TEXT NOT NULL
);

INSERT INTO customers (id, name, city) VALUES
  (1, 'Ada',   'Leeds'),
  (2, 'Grace', 'Hull'),
  (3, 'Linus', NULL),
  (4, 'Barbara', 'Leeds');

-- Ada and Grace have ordered. Linus and Barbara never have.
INSERT INTO orders (id, customer_id, total, status) VALUES
  (10, 1, 3000, 'paid'),
  (11, 1, 1500, 'canceled'),
  (12, 2, NULL, 'paid');
