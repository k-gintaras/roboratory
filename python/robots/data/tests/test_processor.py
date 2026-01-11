from data_robot import process


def test_process_empty():
    assert process([]) == {}


def test_process_numbers():
    rows = [{"x": 1, "y": 2}, {"x": 3, "y": None}]
    out = process(rows)
    assert out["x"]["count"] == 2
    assert out["x"]["sum"] == 4
