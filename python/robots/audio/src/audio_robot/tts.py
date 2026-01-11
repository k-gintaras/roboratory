def say(text: str) -> bytes:
    """Return a bytes blob representing generated audio.

    This is a small stub for experiments. Replace with real TTS engine.
    """
    # For now, return the text encoded as UTF-8 bytes as a placeholder
    return text.encode("utf-8")
