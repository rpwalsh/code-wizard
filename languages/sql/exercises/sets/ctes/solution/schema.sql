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
  ('mobile',   'travel',  50),
  -- data totals 550, which is exactly the average of all four teams.
  -- Without a team sitting on the line, > and >= select the same rows and
  -- the comparison is never actually tested.
  ('data',     'cloud',  300),
  ('data',     'travel', 250);
