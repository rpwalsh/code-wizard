-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
-- An atomic transfer sums to zero by construction; anything else is half a
-- transaction that a BEGIN/COMMIT would have made impossible. The query is
-- the audit you only need when the code lacked the transaction.

SELECT transfer_id, SUM(delta) AS total
FROM movements
GROUP BY transfer_id
HAVING SUM(delta) != 0
ORDER BY transfer_id;
