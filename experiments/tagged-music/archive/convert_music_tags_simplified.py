#!/usr/bin/env python3
"""
Convert old musicTable.csv to simplified tag system.
"""

import csv
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from collections import defaultdict


# Simplified tag system structure
EMPTY_TAGS = {
    "rating": None,
    "genre": [],
    "subgenre": [],
    "pace": None,
    "energy": None,
    "groove": [],
    "melody": [],
    "structure": [],
    "mood": [],
    "style": [],
    "texture": [],
    "vocal": []
}

# Array fields
ARRAY_FIELDS = {
    "genre", "subgenre", "groove", "melody",
    "structure", "mood", "style", "texture", "vocal"
}


# Simplified mapping from old tags to new tags
OLD_TO_NEW_MAP = {
    # GENRE
    "Alternative": {"genre": ["rock"]},
    "Alternative & Punk": {"genre": ["rock"]},
    "Ambient": {"genre": ["ambient"], "melody": ["atmospheric"], "texture": ["ambient"]},
    "Blues": {"genre": ["jazz"]},
    "Dance": {"genre": ["house"], "groove": ["club"]},
    "Dream": {"mood": ["dreamy"], "melody": ["atmospheric"]},
    "Drum and Bass": {"genre": ["dnb"], "pace": "fast", "energy": "high", "groove": ["driving"]},
    "Electro": {"genre": ["house"], "subgenre": ["electro"]},
    "Electronic": {"genre": ["house"], "texture": ["electronic"]},
    "Electronica": {"genre": ["house"], "subgenre": ["electro"]},
    "Folk": {"genre": ["other"], "texture": ["acoustic"]},
    "Hip Hop Rap": {"genre": ["hiphop"], "subgenre": ["rap"]},
    "House": {"genre": ["house"], "groove": ["club"]},
    "IDM": {"genre": ["experimental"], "subgenre": ["idm"]},
    "Inconnu": {"genre": ["other"]},
    "Industrial": {"genre": ["experimental"], "subgenre": ["industrial"], "texture": ["industrial"]},
    "Latin": {"genre": ["latin"], "groove": ["bouncy"]},
    "Madrigals": {"genre": ["classical"], "vocal": ["chorus"]},
    "Mashup": {"subgenre": ["remix"]},
    "Noise": {"genre": ["experimental"], "subgenre": ["noise"], "melody": ["chaotic"]},
    "Other": {"genre": ["other"]},
    "Pop": {"genre": ["pop"]},
    "Progressive House": {"genre": ["house"], "subgenre": ["progressive-house"], "structure": ["progressive"]},
    "R&B / Hip Hop": {"genre": ["hiphop"], "subgenre": ["soul-rnb"]},
    "Rap & Hip-Hop": {"genre": ["hiphop"], "subgenre": ["rap"]},
    "Reggae": {"genre": ["other"], "groove": ["bouncy"]},
    "Remix": {"subgenre": ["remix"]},
    "Rock": {"genre": ["rock"]},
    "Salsa": {"genre": ["latin"], "subgenre": ["newage"]},
    "Soul and R&B": {"subgenre": ["soul-rnb"]},
    "Soundtrack": {"genre": ["other"]},
    "Techno": {"genre": ["techno"], "groove": ["driving"]},
    "Trance": {"genre": ["trance"], "mood": ["uplifting"], "structure": ["progressive"]},
    "Newage": {"subgenre": ["newage"], "genre": ["ambient"], "mood": ["calm"]},

    # SPEED
    "slow": {"pace": "slow", "energy": "low"},
    "fast": {"pace": "fast", "energy": "high"},
    "progressive": {"structure": ["progressive"]},
    "progressive fast": {"pace": "fast", "energy": "high", "structure": ["progressive"]},
    "slow progressive": {"pace": "slow", "structure": ["progressive"]},

    # BEATS
    "flowing": {"groove": ["flowing"]},
    "rhythmic": {"groove": ["driving"]},
    "flowing rhythmic": {"groove": ["flowing", "driving"]},

    # AGE / ERA
    "classical": {"genre": ["classical"], "style": ["classy"]},
    "classy": {"style": ["classy"]},
    "old": {"style": ["oldschool"]},
    "modern": {"style": ["modern"]},
    "new": {"style": ["modern"]},
    "old modern": {"style": ["oldschool", "modern"]},
    "oldschool": {"style": ["oldschool"]},
    "timeless": {"style": ["timeless"]},

    # VOCALS
    "instrumental": {"vocal": ["instrumental"]},
    "vocal": {"vocal": []},  # Will be set based on voice tag
    "vocal instrumental": {"vocal": ["instrumental"]},

    # INSTRUMENTS
    "acoustic": {"texture": ["acoustic"]},
    "classic": {"style": ["classy", "timeless"]},
    "electronic": {"texture": ["electronic"], "genre": ["house"]},
    "guitar": {"texture": ["acoustic"]},
    "guitar piano": {"texture": ["acoustic"]},
    "orchestra": {"texture": ["acoustic"]},
    "piano": {"texture": ["acoustic"]},

    # STYLE
    "beautiful": {"style": ["beautiful"]},
    "beautiful epic": {"style": ["beautiful", "epic"]},
    "beautiful funky": {"style": ["beautiful", "funky"], "groove": ["funky"]},
    "cool": {"style": ["cool"]},
    "cool epic": {"style": ["cool", "epic"]},
    "cool funky": {"style": ["cool", "funky"], "groove": ["funky"]},
    "epic": {"style": ["epic"]},
    "epic funky": {"style": ["epic", "funky"], "groove": ["funky"]},
    "funky": {"style": ["funky"], "groove": ["funky"]},
    "unusual": {"style": ["weird"]},
    "unusual beautiful": {"style": ["weird", "beautiful"]},
    "unusual epic": {"style": ["weird", "epic"]},
    "unusual funky": {"style": ["weird", "funky"], "groove": ["funky"]},

    # ATTITUDE
    "chill": {"mood": ["calm"]},
    "cute": {"style": ["cute"]},
    "cute chill": {"style": ["cute"], "mood": ["calm"]},
    "cute naughty": {"style": ["cute", "naughty"]},
    "cute neutral": {"style": ["cute"]},
    "naughty": {"style": ["naughty"]},
    "neutral": {},
    "serious": {"mood": ["serious"]},

    # WEIGHT / SOUND
    "heavy": {"texture": ["heavy"]},
    "light": {"texture": ["soft"]},
    "deep": {"texture": ["heavy"]},
    "high": {},

    # MELODY
    "dance": {"melody": ["melodic"], "groove": ["club"]},
    "melodic": {"melody": ["melodic", "strong"]},
    "melodic dance": {"melody": ["melodic"], "groove": ["club"]},
    "minimal": {"melody": ["minimal"], "structure": ["loop-heavy"]},

    # ENERGY
    "active": {"energy": "high"},
    "passive": {"energy": "low"},
    "passive active": {"energy": "medium"},

    # VOICE
    "ambient female": {"vocal": ["female", "ambient-voice"]},
    "ambient male": {"vocal": ["male", "ambient-voice"]},
    "ambient": {"texture": ["ambient"], "melody": ["atmospheric"]},
    "chorus": {"vocal": ["chorus"]},
    "female": {"vocal": ["female"]},
    "male": {"vocal": ["male"]},
    "male female": {"vocal": ["mixed"]},
    "male female chorus": {"vocal": ["mixed", "chorus"]},
    "male chorus": {"vocal": ["male", "chorus"]},
    "industrial female": {"vocal": ["female"], "texture": ["industrial"]},
    "industrial male": {"vocal": ["male"], "texture": ["industrial"]},
    "industrial": {"texture": ["industrial"], "subgenre": ["industrial"]},
    "robo": {"vocal": ["robotic"]},
    "robo female": {"vocal": ["robotic", "female"]},

    # SOUNDS / TEXTURE
    "balanced": {"texture": ["balanced"]},
    "balanced strong": {"texture": ["balanced", "strong"]},
    "gentle": {"texture": ["soft"]},
    "soft": {"texture": ["soft"]},
    "soft balanced": {"texture": ["soft", "balanced"]},
    "strong": {"texture": ["strong"]},

    # MOOD
    "calm": {"mood": ["calm"]},
    "calm positive": {"mood": ["calm", "positive"]},
    "calm uplifting": {"mood": ["calm", "uplifting"]},
    "positive": {"mood": ["positive"]},
    "positive happy": {"mood": ["positive", "uplifting"]},
    "positive happy uplifting": {"mood": ["positive", "uplifting"]},
    "positive uplifting": {"mood": ["positive", "uplifting"]},
    "sad": {"mood": ["sad"]},
    "sad uplifting": {"mood": ["sad", "uplifting"]},
    "tense": {"mood": ["tense"]},
    "tense positive uplifting": {"mood": ["tense", "positive", "uplifting"]},
    "tense uplifting": {"mood": ["tense", "uplifting"]},
    "uplifting": {"mood": ["uplifting"]},

    # SECONDARY GENRES
    "atmospheric": {"melody": ["atmospheric"], "texture": ["ambient"]},
    "atmospheric pop": {"genre": ["pop"], "melody": ["atmospheric"]},
    "atmospheric rap": {"genre": ["hiphop"], "subgenre": ["rap"], "melody": ["atmospheric"]},
    "atmospheric techno": {"genre": ["techno"], "melody": ["atmospheric"]},
    "atmospheric techno pop": {"genre": ["techno", "pop"], "melody": ["atmospheric"]},
    "atmospheric trance": {"genre": ["trance"], "melody": ["atmospheric"]},
    "chillout": {"mood": ["calm"], "style": ["oldschool"]},
    "chillout atmospheric": {"mood": ["calm"], "melody": ["atmospheric"]},
    "chillout atmospheric trance": {"genre": ["trance"], "mood": ["calm"], "melody": ["atmospheric"]},
    "chillout pop": {"genre": ["pop"], "mood": ["calm"]},
    "dnb": {"genre": ["dnb"], "pace": "fast", "energy": "high"},
    "house techno": {"genre": ["house", "techno"], "groove": ["club", "driving"]},
    "house techno pop": {"genre": ["house", "techno", "pop"], "groove": ["club"]},
    "pop rap": {"genre": ["pop", "hiphop"], "subgenre": ["rap"]},
    "pop rock": {"genre": ["pop", "rock"]},
    "rap": {"genre": ["hiphop"], "subgenre": ["rap"]},
    "techno dnb": {"genre": ["techno", "dnb"], "pace": "fast", "energy": "high"},
    "techno pop": {"genre": ["techno", "pop"]},
    "techno trance": {"genre": ["techno", "trance"], "structure": ["progressive"]},

    # OTHER / FLAGS
    "acid": {"style": ["weird"]},
    "acid timeless": {"style": ["weird", "timeless"]},
    "dramatic": {"style": ["epic"]},
    "favorite timeless": {"rating": "favorite", "style": ["timeless"]},
    "intrumental": {"vocal": ["instrumental"]},
    "timeless intrumental": {"style": ["timeless"], "vocal": ["instrumental"]},
    "jazz": {"genre": ["jazz"]},
    "long": {},
    "long timeless": {"style": ["timeless"]},
    "long tofix": {},
    "long tofix timeless": {"style": ["timeless"]},
    "music": {},
    "music timeless": {"style": ["timeless"]},
    "rough": {"style": ["rough"], "texture": ["strong"]},
    "tofix": {},
    "tofix rough timeless": {"style": ["rough", "timeless"], "texture": ["strong"]},
    "tofix timeless": {"style": ["timeless"]},
    "vika": {},
    "ubaby": {},
    "vika timeless": {"style": ["timeless"]},
    "voice weird timeless": {"vocal": [], "style": ["weird", "timeless"]},
    "weird": {"style": ["weird"]},
    "weird timeless": {"style": ["weird", "timeless"]},

    # VOLUME
    "loud": {"energy": "high"},
    "quiet": {"energy": "low"},

    # ADDITIONAL COMBINATIONS
    "modern new": {"style": ["modern"]},
    "classy old": {"style": ["oldschool", "classy"]},
    "classical classy modern": {"genre": ["classical"], "style": ["classy", "modern"]},
    "electro": {"texture": ["electronic"]},
}


def derive_bpm_tags(bpm: Optional[float]) -> Dict[str, Any]:
    """Derive pace and energy from BPM."""
    if not bpm or bpm <= 0:
        return {}

    tags = {}

    if bpm < 85:
        tags["pace"] = "slow"
        tags["energy"] = "low"
    elif bpm < 115:
        tags["pace"] = "mid"
        tags["energy"] = "medium"
    elif bpm < 140:
        tags["pace"] = "fast"
        tags["energy"] = "high"
    else:
        tags["pace"] = "fast"
        tags["energy"] = "peak"

    return tags


def merge_patch(target: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    """Merge a patch into target."""
    for key, value in patch.items():
        if value is None or value == "":
            continue

        if key in ARRAY_FIELDS:
            if not isinstance(value, list):
                value = [value]
            target[key] = list(set(target.get(key, []) + value))
        else:
            # For scalar fields, only overwrite if current is None
            if target.get(key) is None:
                target[key] = value

    return target


def is_valid_tag(tag: str) -> bool:
    """Check if a tag is valid."""
    if ':' in tag or '\\' in tag or '/' in tag:
        return False
    if len(tag) == 0 or len(tag) > 100:
        return False
    return True


def normalize_song(old_tags: List[str], bpm: Optional[float] = None) -> Dict[str, Any]:
    """Convert old tags to simplified tags."""
    result = json.loads(json.dumps(EMPTY_TAGS))
    unmapped_tags = []

    # Create case-insensitive lookup
    tag_map_lower = {k.lower(): v for k, v in OLD_TO_NEW_MAP.items()}

    # Process each old tag
    for tag in old_tags:
        tag = tag.strip()
        if not tag or not is_valid_tag(tag):
            continue

        tag_lower = tag.lower()
        if tag_lower in tag_map_lower:
            patch = tag_map_lower[tag_lower]
            if patch:
                merge_patch(result, patch)
        else:
            unmapped_tags.append(tag)

    # Derive BPM tags if available
    if bpm:
        bpm_tags = derive_bpm_tags(bpm)
        merge_patch(result, bpm_tags)

    return {
        "normalizedTags": result,
        "unmappedTags": unmapped_tags
    }


def parse_bpm(bpm_str: str) -> Optional[float]:
    """Parse BPM string to float."""
    try:
        if not bpm_str or bpm_str.strip() == "":
            return None
        return float(bpm_str.strip())
    except (ValueError, AttributeError):
        return None


def extract_old_tags(row: Dict[str, str]) -> List[str]:
    """Extract all tag values from the old CSV row."""
    tag_columns = [
        'originalGenre', 'volume', 'speed', 'beats', 'age', 'vocals',
        'instruments', 'funk', 'attitude', 'weight', 'pitch', 'melody',
        'energy', 'voice', 'sounds', 'mood', 'genre', 'other'
    ]

    tags = []
    for col in tag_columns:
        value = row.get(col, '').strip()
        if value:
            tags.append(value)

    return tags


def convert_music_table(input_path: str, output_path: str):
    """Convert old musicTable.csv to simplified format."""
    print(f"Reading {input_path}...")

    converted_songs = []
    stats = {
        "total": 0,
        "with_bpm": 0,
        "unmapped_tags": defaultdict(int)
    }

    with open(input_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row in reader:
            stats["total"] += 1

            # Extract metadata
            title = row.get('title', '').strip()
            artist = row.get('artist', '').strip()
            album = row.get('album', '').strip()
            file_path = row.get('dir', '').strip()

            # Extract BPM and key
            bpm = parse_bpm(row.get('bpm', ''))
            initial_key = row.get('initialKey', '').strip() or None

            if bpm:
                stats["with_bpm"] += 1

            # Extract old tags
            old_tags = extract_old_tags(row)

            # Normalize tags
            normalized = normalize_song(old_tags, bpm)

            # Track unmapped tags
            for tag in normalized["unmappedTags"]:
                stats["unmapped_tags"][tag] += 1

            # Create song record
            song = {
                "title": title,
                "artist": artist,
                "album": album,
                "filePath": file_path,
                "tags": normalized["normalizedTags"],
                "bpm": bpm,
                "initialKey": initial_key
            }

            converted_songs.append(song)

    # Write output
    print(f"\nWriting {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(converted_songs, f, indent=2, ensure_ascii=False)

    # Print stats
    print("\n" + "="*60)
    print("CONVERSION STATISTICS")
    print("="*60)
    print(f"Total songs: {stats['total']}")
    print(f"Songs with BPM: {stats['with_bpm']}")
    print(f"\nUnmapped tags found: {len(stats['unmapped_tags'])}")

    if stats['unmapped_tags']:
        print("\nUnmapped tags:")
        sorted_unmapped = sorted(stats['unmapped_tags'].items(), key=lambda x: x[1], reverse=True)
        for tag, count in sorted_unmapped[:20]:
            print(f"  '{tag}': {count} occurrences")

    print(f"\nConversion complete! Output saved to: {output_path}")


if __name__ == "__main__":
    script_dir = Path(__file__).parent
    input_csv = script_dir.parent.parent / "assets" / "musicTable.csv"
    output_json = script_dir / "musicTable_simplified.json"

    convert_music_table(str(input_csv), str(output_json))
