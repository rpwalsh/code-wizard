-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE expenses (
  team TEXT NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL
);

INSERT INTO expenses (team, category, amount) VALUES
  ('platform', 'cloud',  400),
  ('platform', 'travel', 100),
  ('platform', 'cloud',  300),
  ('search',   'cloud',  200),
  ('search',   'travel', 500),
  ('mobile',   'cloud',  100),
  ('mobile',   'travel',  50);
