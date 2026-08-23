# Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
"""Support modules the runtime puts on the interpreter's path.

A package rather than a set of prefixed top-level modules, because the
learner's own workspace is on ``sys.path`` too: a bare ``trace.py`` would
shadow the standard library, and ``report.py`` or ``expect.py`` would collide
with anything they happen to create. One name is enough to stay out of the
way, and ``from retrainer.expect import expect_equal`` reads like a library
instead of like a prefix.

Nothing here is imported for its side effects; each module stands alone.
"""
