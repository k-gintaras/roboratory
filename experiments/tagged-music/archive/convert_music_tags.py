#!/usr/bin/env python3
"""
Convert old musicTable.csv to new tag system.
Preserves old tags while generating normalized tags based on the mapping.
"""

import csv
import json
from typing import Dict, List, Set, Any, Optional
from pathlib import Path
from collections import defaultdict


# New tag system structure
EMPTY_TAGS = {
    "genre": [],
    "subgenre": [],
    "pace": "unknown",
    "energy": "unknown",
    "groove": [],
    "melody": [],
    "harmony": [],
    "repetition": "unknown",
    "progression": "unknown",
    "mood": [],
    "attitude": [],
    "style": [],
    "texture": [],
    "weight": "unknown",
    "soundProfile": [],
    "vocalPresence": "unknown",
    "vocalSource": [],
    "vocalStyle": [],
    "instrumentation": [],
    "eraFeel": [],
    "mixFit": [],
    "flags": []
}

# Array fields that should be merged
ARRAY_FIELDS = {
    "genre", "subgenre", "groove", "melody", "harmony", "mood",
    "attitude", "style", "texture", "soundProfile", "vocalSource",
    "vocalStyle", "instrumentation", "eraFeel", "mixFit", "flags"
}


# Old tag to new tag mapping (from music-tags-mapping.MD)
OLD_TO_NEW_MAP = {
    # GENRE / ORIGINAL GENRE
    "Alternative": {"genre": ["rock"], "subgenre": []},
    "Alternative & Punk": {"genre": ["rock"], "subgenre": []},
    "Ambient": {"genre": ["ambient"], "melody": ["atmospheric"], "texture": ["ambient"]},
    "Blues": {"genre": ["jazz"]},
    "Dance": {"genre": ["electronic"], "subgenre": ["dance"], "groove": ["club"]},
    "Dream": {"mood": ["dreamy"], "melody": ["atmospheric"]},
    "Drum and Bass": {"genre": ["dnb", "electronic"], "pace": "fast", "energy": "high", "groove": ["driving"]},
    "Electro": {"genre": ["electronic"], "subgenre": ["electro"]},
    "Electronic": {"genre": ["electronic"], "texture": ["electronic"]},
    "Electronica": {"genre": ["electronic"], "subgenre": ["electronica"]},
    "Folk": {"genre": ["folk"], "texture": ["acoustic"]},
    "Hip Hop Rap": {"genre": ["hiphop"], "subgenre": ["rap"]},
    "House": {"genre": ["house"], "groove": ["club"]},
    "IDM": {"genre": ["electronic", "experimental"], "subgenre": ["idm"]},
    "Inconnu": {"genre": ["unknown"]},
    "Industrial": {"genre": ["experimental"], "subgenre": ["industrial"], "texture": ["industrial"], "weight": "heavy"},
    "Latin": {"genre": ["latin"], "groove": ["rhythmic"]},
    "Madrigals": {"genre": ["classical"], "subgenre": ["madrigal"], "vocalSource": ["chorus"]},
    "Mashup": {"subgenre": ["mashup"], "flags": ["remix"]},
    "Noise": {"genre": ["experimental"], "subgenre": ["noise"], "harmony": ["rough", "experimental"], "melody": ["chaotic"]},
    "Other": {"genre": ["unknown"]},
    "Pop": {"genre": ["pop"]},
    "Progressive House": {"genre": ["house"], "subgenre": ["progressive-house"], "progression": "progressive"},
    "R&B / Hip Hop": {"genre": ["hiphop"], "subgenre": ["soul-rnb"]},
    "Rap & Hip-Hop": {"genre": ["hiphop"], "subgenre": ["rap"]},
    "Reggae": {"genre": ["reggae"], "groove": ["bouncy"]},
    "Remix": {"subgenre": ["remix"], "flags": ["remix"]},
    "Rock": {"genre": ["rock"]},
    "Salsa": {"genre": ["latin"], "subgenre": ["salsa"], "groove": ["rhythmic"]},
    "Soul and R&B": {"subgenre": ["soul-rnb"]},
    "Soundtrack": {"genre": ["soundtrack"], "attitude": ["dramatic"]},
    "Techno": {"genre": ["techno", "electronic"], "groove": ["driving", "club"]},
    "Trance": {"genre": ["trance", "electronic"], "mood": ["uplifting"], "progression": "progressive"},
    "Newage": {"subgenre": ["newage"], "genre": ["ambient"], "mood": ["calm"]},

    # VOLUME
    "loud": {"soundProfile": ["loud"], "energy": "high"},
    "quiet": {"soundProfile": ["quiet"], "energy": "low"},

    # SPEED
    "slow": {"pace": "slow", "energy": "low"},
    "fast": {"pace": "fast", "energy": "high"},
    "progressive": {"progression": "progressive"},
    "progressive fast": {"pace": "fast", "energy": "high", "progression": "progressive"},
    "slow progressive": {"pace": "slow", "progression": "progressive"},

    # BEATS
    "flowing": {"groove": ["flowing"]},
    "rhythmic": {"groove": ["rhythmic"]},
    "flowing rhythmic": {"groove": ["flowing", "rhythmic"]},

    # AGE / ERA FEEL
    "classical": {"genre": ["classical"], "eraFeel": ["classic"]},
    "classy": {"style": ["classy"], "harmony": ["classy"]},
    "old": {"eraFeel": ["oldschool"]},
    "modern": {"eraFeel": ["modern"], "style": ["modern"]},
    "new": {"eraFeel": ["new"]},
    "old modern": {"eraFeel": ["oldschool", "modern"], "mixFit": ["style-clash-risk"]},
    "oldschool": {"eraFeel": ["oldschool"], "style": ["oldschool"]},
    "timeless": {"eraFeel": ["timeless"], "style": ["timeless"]},

    # VOCALS OLD
    "instrumental": {"vocalPresence": "instrumental"},
    "vocal": {"vocalPresence": "vocal"},
    "vocal instrumental": {"vocalPresence": "mostly-instrumental"},
    "electro": {"texture": ["electronic"]},
    "ubaby": {"flags": ["personal"]},

    # INSTRUMENTS
    "acoustic": {"texture": ["acoustic"], "instrumentation": ["acoustic"]},
    "classic": {"eraFeel": ["classic"]},
    "electronic": {"texture": ["electronic"], "genre": ["electronic"]},
    "guitar": {"instrumentation": ["guitar"]},
    "guitar piano": {"instrumentation": ["guitar", "piano"]},
    "orchestra": {"instrumentation": ["orchestra"]},
    "piano": {"instrumentation": ["piano"]},

    # FUNK / STYLE
    "beautiful": {"style": ["beautiful"]},
    "beautiful epic": {"style": ["beautiful"], "attitude": ["epic"]},
    "beautiful funky": {"style": ["beautiful", "funky"], "groove": ["funky"]},
    "cool": {"style": ["cool"]},
    "cool epic": {"style": ["cool"], "attitude": ["epic"]},
    "cool funky": {"style": ["cool", "funky"], "groove": ["funky"]},
    "epic": {"attitude": ["epic"]},
    "epic funky": {"attitude": ["epic"], "style": ["funky"], "groove": ["funky"]},
    "funky": {"style": ["funky"], "groove": ["funky", "swing"]},
    "unusual": {"style": ["unusual"], "harmony": ["experimental"]},
    "unusual beautiful": {"style": ["unusual", "beautiful"]},
    "unusual epic": {"style": ["unusual"], "attitude": ["epic"]},
    "unusual funky": {"style": ["unusual", "funky"], "groove": ["funky"]},

    # ATTITUDE
    "chill": {"attitude": ["chill"], "mood": ["calm"]},
    "cute": {"attitude": ["cute"]},
    "cute chill": {"attitude": ["cute", "chill"], "mood": ["calm"]},
    "cute naughty": {"attitude": ["cute", "naughty"]},
    "cute neutral": {"attitude": ["cute", "neutral"]},
    "naughty": {"attitude": ["naughty"]},
    "neutral": {"attitude": ["neutral"]},
    "serious": {"attitude": ["serious"], "mood": ["serious"]},

    # WEIGHT / PITCH
    "heavy": {"weight": "heavy", "texture": ["strong"]},
    "light": {"weight": "light", "texture": ["gentle"]},
    "deep": {"soundProfile": ["deep"]},
    "high": {"soundProfile": ["high"]},

    # MELODY
    "dance": {"melody": ["dance-melody"], "groove": ["club"]},
    "melodic": {"melody": ["melodic", "strong-melody"]},
    "melodic dance": {"melody": ["melodic", "dance-melody"], "groove": ["club"]},
    "minimal": {"melody": ["minimal"], "repetition": "loop-heavy"},

    # ENERGY
    "active": {"energy": "high"},
    "passive": {"energy": "low"},
    "passive active": {"energy": "medium"},

    # VOICE
    "ambient female": {"vocalSource": ["female", "ambient-voice"], "vocalStyle": ["texture"]},
    "ambient male": {"vocalSource": ["male", "ambient-voice"], "vocalStyle": ["texture"]},
    "ambient": {"texture": ["ambient"], "melody": ["atmospheric"]},
    "chorus": {"vocalSource": ["chorus"], "vocalStyle": ["chant"]},
    "female": {"vocalSource": ["female"], "vocalPresence": "vocal"},
    "male": {"vocalSource": ["male"], "vocalPresence": "vocal"},
    "male female": {"vocalSource": ["male", "female", "mixed"], "vocalPresence": "vocal"},
    "male female chorus": {"vocalSource": ["male", "female", "mixed", "chorus"], "vocalPresence": "vocal"},
    "male chorus": {"vocalSource": ["male", "chorus"], "vocalPresence": "vocal"},
    "industrial female": {"vocalSource": ["female", "industrial-voice"], "texture": ["industrial"]},
    "industrial male": {"vocalSource": ["male", "industrial-voice"], "texture": ["industrial"]},
    "industrial": {"texture": ["industrial"], "subgenre": ["industrial"]},
    "robo": {"vocalSource": ["robotic"], "vocalStyle": ["sampled"]},
    "robo female": {"vocalSource": ["robotic", "female"], "vocalStyle": ["sampled"]},

    # SOUNDS
    "balanced": {"texture": ["balanced"]},
    "balanced strong": {"texture": ["balanced", "strong"]},
    "gentle": {"texture": ["gentle"]},
    "soft": {"texture": ["soft"]},
    "soft balanced": {"texture": ["soft", "balanced"]},
    "strong": {"texture": ["strong"]},

    # MOOD
    "calm": {"mood": ["calm"]},
    "calm positive": {"mood": ["calm", "positive"]},
    "calm uplifting": {"mood": ["calm", "uplifting"]},
    "positive": {"mood": ["positive"]},
    "positive happy": {"mood": ["positive", "happy"]},
    "positive happy uplifting": {"mood": ["positive", "happy", "uplifting"]},
    "positive uplifting": {"mood": ["positive", "uplifting"]},
    "sad": {"mood": ["sad"]},
    "sad uplifting": {"mood": ["sad", "uplifting"]},
    "tense": {"mood": ["tense"]},
    "tense positive uplifting": {"mood": ["tense", "positive", "uplifting"]},
    "tense uplifting": {"mood": ["tense", "uplifting"]},
    "uplifting": {"mood": ["uplifting"]},

    # SECONDARY GENRE OLD
    "atmospheric": {"melody": ["atmospheric"], "texture": ["ambient"]},
    "atmospheric pop": {"genre": ["pop"], "melody": ["atmospheric"]},
    "atmospheric rap": {"genre": ["hiphop"], "subgenre": ["rap"], "melody": ["atmospheric"]},
    "atmospheric techno": {"genre": ["techno"], "melody": ["atmospheric"]},
    "atmospheric techno pop": {"genre": ["techno", "pop"], "melody": ["atmospheric"]},
    "atmospheric trance": {"genre": ["trance"], "melody": ["atmospheric"]},
    "chillout": {"mood": ["calm"], "attitude": ["chill"]},
    "chillout atmospheric": {"mood": ["calm"], "attitude": ["chill"], "melody": ["atmospheric"]},
    "chillout atmospheric trance": {"genre": ["trance"], "mood": ["calm"], "melody": ["atmospheric"]},
    "chillout pop": {"genre": ["pop"], "mood": ["calm"]},
    "dnb": {"genre": ["dnb", "electronic"], "pace": "fast", "energy": "high"},
    "house techno": {"genre": ["house", "techno"], "groove": ["club", "driving"]},
    "house techno pop": {"genre": ["house", "techno", "pop"], "groove": ["club"]},
    "pop rap": {"genre": ["pop", "hiphop"], "subgenre": ["rap"]},
    "pop rock": {"genre": ["pop", "rock"]},
    "rap": {"genre": ["hiphop"], "subgenre": ["rap"]},
    "techno dnb": {"genre": ["techno", "dnb"], "pace": "fast", "energy": "high"},
    "techno pop": {"genre": ["techno", "pop"]},
    "techno trance": {"genre": ["techno", "trance"], "progression": "progressive"},

    # OTHER / FLAGS
    "acid": {"style": ["experimental"], "soundProfile": ["hard"]},
    "acid timeless": {"style": ["experimental", "timeless"], "eraFeel": ["timeless"]},
    "dramatic": {"attitude": ["dramatic"]},
    "favorite timeless": {"flags": ["favorite"], "eraFeel": ["timeless"]},
    "intrumental": {"vocalPresence": "instrumental"},
    "timeless intrumental": {"eraFeel": ["timeless"], "vocalPresence": "instrumental"},
    "jazz": {"genre": ["jazz"]},
    "long": {"flags": ["long"]},
    "long timeless": {"flags": ["long"], "eraFeel": ["timeless"]},
    "long tofix": {"flags": ["long", "tofix"]},
    "long tofix timeless": {"flags": ["long", "tofix"], "eraFeel": ["timeless"]},
    "music": {},
    "music timeless": {"eraFeel": ["timeless"]},
    "rough": {"flags": ["rough"], "harmony": ["rough"], "texture": ["rough"]},
    "tofix": {"flags": ["tofix"]},
    "tofix rough timeless": {"flags": ["tofix", "rough"], "eraFeel": ["timeless"], "harmony": ["rough"]},
    "tofix timeless": {"flags": ["tofix"], "eraFeel": ["timeless"]},
    "vika": {"flags": ["personal"]},
    "vika timeless": {"flags": ["personal"], "eraFeel": ["timeless"]},
    "voice weird timeless": {
        "vocalPresence": "vocal",
        "vocalStyle": ["random-words"],
        "flags": ["weird"],
        "eraFeel": ["timeless"]
    },
    "weird": {"flags": ["weird"], "style": ["unusual"], "harmony": ["weird"]},
    "weird timeless": {"flags": ["weird"], "style": ["unusual", "timeless"], "eraFeel": ["timeless"]},

    # ADDITIONAL COMBINATIONS (found in data)
    "modern new": {"eraFeel": ["modern", "new"], "style": ["modern"]},
    "classy old": {"eraFeel": ["oldschool"], "style": ["classy"], "harmony": ["classy"]},
    "classical classy modern": {"genre": ["classical"], "eraFeel": ["classic", "modern"], "style": ["classy"], "harmony": ["classy"]}
}


def derive_bpm_tags(bpm: Optional[float]) -> Dict[str, Any]:
    """
    Derive pace and energy from BPM.
    Note: BPM might be unreliable (auto-generated), so we add a flag if suspicious.
    """
    if not bpm or bpm <= 0:
        return {"pace": "unknown", "flags": ["bpm-missing"]}

    tags = {}

    # Suspicious BPM ranges (likely half-time or double-time detection errors)
    if bpm < 60 or bpm > 200:
        tags["flags"] = ["bpm-suspicious"]

    # Standard mapping
    if bpm < 85:
        tags["pace"] = "slow"
        tags["energy"] = "low"
    elif bpm < 115:
        tags["pace"] = "mid"
        tags["energy"] = "medium"
    elif bpm < 140:
        tags["pace"] = "fast"
        tags["energy"] = "high"
    elif bpm < 175:
        tags["pace"] = "fast"
        tags["energy"] = "peak"
    else:
        tags["pace"] = "fast"
        tags["energy"] = "peak"

    return tags


def merge_patch(target: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    """Merge a patch into target, combining array fields and overwriting scalar fields."""
    for key, value in patch.items():
        if value is None:
            continue

        if key in ARRAY_FIELDS:
            if not isinstance(value, list):
                value = [value]
            target[key] = list(set(target.get(key, []) + value))
        else:
            # For scalar fields, only overwrite if current is "unknown" or not set
            if target.get(key) in [None, "unknown"]:
                target[key] = value

    return target


def is_valid_tag(tag: str) -> bool:
    """Check if a tag is valid (not a file path or other garbage)."""
    # Filter out file paths
    if ':' in tag or '\\' in tag or '/' in tag:
        return False
    # Filter out empty or very long tags
    if len(tag) == 0 or len(tag) > 100:
        return False
    return True


def normalize_song(old_tags: List[str], bpm: Optional[float] = None) -> Dict[str, Any]:
    """
    Convert old tags to new normalized tags.
    Returns a dict with normalized tags and unmapped tags.
    """
    result = json.loads(json.dumps(EMPTY_TAGS))  # Deep copy
    unmapped_tags = []

    # Create case-insensitive lookup
    tag_map_lower = {k.lower(): v for k, v in OLD_TO_NEW_MAP.items()}

    # Process each old tag
    for tag in old_tags:
        tag = tag.strip()
        if not tag or not is_valid_tag(tag):
            continue

        # Try case-insensitive lookup
        tag_lower = tag.lower()
        if tag_lower in tag_map_lower:
            patch = tag_map_lower[tag_lower]
            if patch:  # Only merge if patch is not empty
                merge_patch(result, patch)
        else:
            unmapped_tags.append(tag)
            # Still flag it in the normalized tags
            result["flags"].append(f"unmapped:{tag}")

    # Derive BPM tags if available (but don't override explicit tags)
    if bpm:
        bpm_tags = derive_bpm_tags(bpm)
        merge_patch(result, bpm_tags)

    # Deduplicate flags
    result["flags"] = list(set(result["flags"]))

    return {
        "normalizedTags": result,
        "unmappedTags": unmapped_tags
    }


def parse_bpm(bpm_str: str) -> Optional[float]:
    """Parse BPM string to float, return None if invalid."""
    try:
        if not bpm_str or bpm_str.strip() == "":
            return None
        return float(bpm_str.strip())
    except (ValueError, AttributeError):
        return None


def extract_old_tags(row: Dict[str, str]) -> List[str]:
    """Extract all tag values from the old CSV row."""
    # These are the tag columns (not metadata)
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
    """
    Convert old musicTable.csv to new format with normalized tags.
    """
    print(f"Reading {input_path}...")

    converted_songs = []
    stats = {
        "total": 0,
        "with_bpm": 0,
        "suspicious_bpm": 0,
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

            # Check for suspicious BPM
            if "bpm-suspicious" in normalized["normalizedTags"]["flags"]:
                stats["suspicious_bpm"] += 1

            # Create song record
            song = {
                "title": title,
                "artist": artist,
                "album": album,
                "filePath": file_path,
                "oldTags": old_tags,
                "normalizedTags": normalized["normalizedTags"],
                "bpm": bpm,
                "initialKey": initial_key,
                "unmappedTags": normalized["unmappedTags"]
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
    print(f"Suspicious BPM values: {stats['suspicious_bpm']}")
    print(f"\nUnmapped tags found: {len(stats['unmapped_tags'])}")

    if stats['unmapped_tags']:
        print("\nTop 20 unmapped tags:")
        sorted_unmapped = sorted(stats['unmapped_tags'].items(), key=lambda x: x[1], reverse=True)
        for tag, count in sorted_unmapped[:20]:
            print(f"  '{tag}': {count} occurrences")

    print(f"\nConversion complete! Output saved to: {output_path}")


if __name__ == "__main__":
    # Use paths relative to the script
    script_dir = Path(__file__).parent
    input_csv = script_dir.parent.parent / "assets" / "musicTable.csv"
    output_json = script_dir / "musicTable_converted.json"

    convert_music_table(str(input_csv), str(output_json))
