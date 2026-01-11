from typing import List, Dict, Any


def process(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Simple processor that summarizes numeric columns.

    This is an intentionally tiny example for experiments.
    """
    summary = {}
    if not rows:
        return summary
    keys = rows[0].keys()
    for k in keys:
        vals = [r[k] for r in rows if isinstance(r.get(k), (int, float))]
        if vals:
            summary[k] = {"count": len(vals), "sum": sum(vals)}
    return summary
