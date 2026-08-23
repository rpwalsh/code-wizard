-- Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
CREATE TABLE submissions (
  student TEXT NOT NULL,
  score INTEGER,          -- NULL: not yet graded
  submitted_at TEXT NOT NULL
);

INSERT INTO submissions (student, score, submitted_at) VALUES
  ('ada', 91, '2026-03-01'),
  ('bo',  67, '2026-03-01'),
  ('cy',  84, '2026-03-02'),
  ('dee', NULL, '2026-03-02'),
  ('eli', 45, '2026-03-03'),
  ('fay', 70, '2026-03-03'),
  -- Exactly on the boundaries: without these, >= and > grade identically
  -- and the cutoffs are never actually tested.
  ('gus', 85, '2026-03-04'),
  ('hal', 50, '2026-03-04');
