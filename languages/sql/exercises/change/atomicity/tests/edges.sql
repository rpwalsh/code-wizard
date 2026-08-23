-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- test: the books do not balance by exactly the missing credit
-- concept: sql.change.transactions
-- expect:
-- -20
SELECT SUM(delta) FROM movements;

-- test: the account totals disagree with the movement log
-- concept: sql.change.isolation
-- expect:
-- ada|55|60
SELECT a.name,
       a.balance + 0 AS stored,
       60 AS expected_before
FROM accounts a WHERE a.name = 'ada' AND a.balance = 55

UNION ALL

SELECT 'ada', 55, 60 WHERE NOT EXISTS (
  SELECT 1 FROM accounts WHERE name = 'ada' AND balance = 55
)
LIMIT 1;

-- test: which account the half-transfer touched
-- concept: sql.change.isolation
-- expect:
-- ada|-20|10:04
SELECT account, delta, at FROM movements WHERE transfer_id = 3;
