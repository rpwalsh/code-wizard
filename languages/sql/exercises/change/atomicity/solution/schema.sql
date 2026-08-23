-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- A ledger, and the transfer log that should explain it. Transfers were
-- applied by two separate UPDATEs with no transaction around them; the
-- crash at 10:04 landed between a debit and its credit.
CREATE TABLE accounts (
  name TEXT PRIMARY KEY,
  balance INTEGER NOT NULL
);

CREATE TABLE movements (
  transfer_id INTEGER NOT NULL,
  account TEXT NOT NULL,
  delta INTEGER NOT NULL,
  at TEXT NOT NULL
);

INSERT INTO accounts (name, balance) VALUES
  ('ada', 60), ('bo', 90), ('cy', 50);

INSERT INTO movements (transfer_id, account, delta, at) VALUES
  (1, 'ada', -40, '10:01'),
  (1, 'bo',   40, '10:01'),
  (2, 'bo',  -10, '10:02'),
  (2, 'cy',   10, '10:02'),
  (3, 'ada', -20, '10:04'),   -- the debit landed...
  (4, 'cy',  -15, '10:05'),
  (4, 'ada',  15, '10:05');
