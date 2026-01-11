# Python workspace

This folder contains Python robots and shared utilities used for experiments.

Structure:

- `robots/audio` — audio robot (TTS, audio helpers)
- `robots/data` — data-processing robot
- `shared` — utilities shared across Python packages

Quickstart:

1. Create a venv: `python -m venv .venv`
2. Activate and install editable packages, or use `pip install -e ./shared` etc.
3. Run tests with `pytest` from the `python/` folder.
