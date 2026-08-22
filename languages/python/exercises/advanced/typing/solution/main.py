"""Annotations."""


def initials(names: list[str]) -> str:
    """Join the first letter of each name."""
    return "".join(name[0] for name in names if name)


def lookup(records: dict[str, int], key: str) -> int | None:
    """Return the value for key, or None."""
    return records.get(key)


def totals(rows: list[dict[str, int]]) -> dict[str, int]:
    """Sum each column across the rows."""
    summed: dict[str, int] = {}
    for row in rows:
        for column, value in row.items():
            summed[column] = summed.get(column, 0) + value
    return summed


def describe_signature(function) -> list[str]:
    """Return the parameter annotation names, in order."""
    rendered = []
    for name, annotation in function.__annotations__.items():
        if name == "return":
            continue
        rendered.append(_render(annotation))
    return rendered


def _render(annotation) -> str:
    """A plain class shows as its name; anything else shows as itself.

    `list[str]` has a `__name__` of just `list`, which throws away the part
    worth reading, so only plain classes take that route.
    """
    text = str(annotation)
    if text.startswith("<class "):
        return annotation.__name__
    return text
