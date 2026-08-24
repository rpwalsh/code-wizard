-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE sales (
  region TEXT NOT NULL,
  seller TEXT NOT NULL,
  amount INTEGER NOT NULL
);

INSERT INTO sales (region, seller, amount) VALUES
  ('north', 'ada',   500),
  ('north', 'bo',    500),
  ('north', 'cy',    300),
  ('north', 'dee',   100),
  ('south', 'eve',   900),
  ('south', 'fay',   400);
