import re


def slugify(text: str) -> str:
    """Return a simple slug from text (lowercase, dashes)."""
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s
