from audio_robot import say


def test_say_returns_bytes():
    out = say("hello")
    assert isinstance(out, bytes)
    assert out == b"hello"
