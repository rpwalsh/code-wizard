"""Backtracking."""


def subsets(values):
    """Every subset, sorted by length then contents."""
    found = []
    chosen = []

    def walk(start):
        # A copy: the working list is about to change again.
        found.append(list(chosen))
        for index in range(start, len(values)):
            chosen.append(values[index])
            walk(index + 1)
            chosen.pop()

    walk(0)
    return sorted(found, key=lambda subset: (len(subset), subset))


def permutations(values):
    """Every ordering, sorted."""
    found = []
    chosen = []
    used = [False] * len(values)

    def walk():
        if len(chosen) == len(values):
            found.append(list(chosen))
            return
        for index in range(len(values)):
            if used[index]:
                continue
            used[index] = True
            chosen.append(values[index])
            walk()
            chosen.pop()
            used[index] = False

    walk()
    return sorted(found)


def combinations_summing(candidates, target):
    """Every combination summing to target, candidates reusable."""
    found = []
    chosen = []
    options = sorted(candidates)

    def walk(start, remaining):
        if remaining == 0:
            found.append(list(chosen))
            return
        for index in range(start, len(options)):
            # Sorted, so once one option is too large the rest are too.
            if options[index] > remaining:
                break
            chosen.append(options[index])
            walk(index, remaining - options[index])
            chosen.pop()

    walk(0, target)
    return sorted(found)


def queens(n):
    """Number of ways to place n non-attacking queens on an n by n board."""
    columns = []

    def safe(column):
        row = len(columns)
        for earlier_row in range(row):
            earlier = columns[earlier_row]
            if earlier == column:
                return False
            if row - earlier_row == abs(column - earlier):
                return False
        return True

    def walk():
        if len(columns) == n:
            return 1
        total = 0
        for column in range(n):
            if not safe(column):
                continue
            columns.append(column)
            total = total + walk()
            columns.pop()
        return total

    return walk()
