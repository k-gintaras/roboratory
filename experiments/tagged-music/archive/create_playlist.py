#!/usr/bin/env python3
"""
Create playlists based on tag queries.
"""

import json
import argparse
from typing import List, Dict, Any
from pathlib import Path
from inspect_converted_music import load_music_db, search_by_tags


# Predefined playlist recipes from the mapping document
PLAYLIST_RECIPES = {
    "funky-vocal-female-positive-house": {
        "name": "Funky Vocal Female Positive House",
        "description": "Funky house tracks with female vocals and positive vibes",
        "query": {
            "genre": ["house"],
            "groove": ["funky", "swing"],
            "vocalSource": ["female"],
            "vocalPresence": ["vocal"],
            "mood": ["positive"]
        }
    },
    "cool-house": {
        "name": "Cool House",
        "description": "Tight, driving house with cool vibes",
        "query": {
            "genre": ["house"],
            "groove": ["tight", "driving", "club"],
            "style": ["cool"]
        }
    },
    "progressive-positive": {
        "name": "Progressive Positive",
        "description": "Progressive tracks with positive, uplifting energy",
        "query": {
            "progression": ["progressive"],
            "mood": ["positive", "uplifting"]
        }
    },
    "fast-uplifting": {
        "name": "Fast Uplifting",
        "description": "High-energy, fast-paced uplifting music",
        "query": {
            "pace": ["fast"],
            "energy": ["high", "peak"],
            "mood": ["uplifting", "positive"]
        }
    },
    "positive-pop-good": {
        "name": "Positive Pop That Does Not Suck",
        "description": "Well-crafted pop with strong melody and cohesion",
        "query": {
            "genre": ["pop"],
            "mood": ["positive"],
            "melody": ["strong-melody", "melodic"]
        }
    },
    "industrial-hard": {
        "name": "Industrial Hard",
        "description": "Heavy industrial tracks with strong texture",
        "query": {
            "texture": ["industrial", "strong"],
            "weight": ["heavy"]
        }
    },
    "ambient-soft": {
        "name": "Ambient Soft",
        "description": "Soft, gentle ambient tracks for calm moods",
        "query": {
            "genre": ["ambient"],
            "texture": ["ambient", "soft", "gentle"],
            "mood": ["calm"]
        }
    },
    "dnb-fast": {
        "name": "Drum and Bass - Fast Energy",
        "description": "High-energy DnB with driving grooves",
        "query": {
            "genre": ["dnb"],
            "pace": ["fast"],
            "energy": ["high", "peak"]
        }
    },
    "chill-atmospheric": {
        "name": "Chill Atmospheric",
        "description": "Chilled out atmospheric vibes",
        "query": {
            "attitude": ["chill"],
            "melody": ["atmospheric"]
        }
    },
    "vocal-house-timeless": {
        "name": "Timeless Vocal House",
        "description": "Classic vocal house tracks that stand the test of time",
        "query": {
            "genre": ["house"],
            "vocalPresence": ["vocal"],
            "eraFeel": ["timeless"]
        }
    }
}


def create_m3u_playlist(songs: List[Dict[str, Any]], output_path: str, name: str, description: str = ""):
    """Create an M3U playlist file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("#EXTM3U\n")
        if description:
            f.write(f"#PLAYLIST:{name}\n")
            f.write(f"#DESCRIPTION:{description}\n")

        for song in songs:
            duration = -1  # Unknown duration
            artist = song['artist']
            title = song['title']
            path = song['filePath']

            f.write(f"#EXTINF:{duration},{artist} - {title}\n")
            f.write(f"{path}\n")


def create_json_playlist(songs: List[Dict[str, Any]], output_path: str, name: str, description: str = ""):
    """Create a JSON playlist file with full metadata."""
    playlist = {
        "name": name,
        "description": description,
        "count": len(songs),
        "songs": [
            {
                "title": song['title'],
                "artist": song['artist'],
                "album": song['album'],
                "filePath": song['filePath'],
                "bpm": song['bpm'],
                "initialKey": song['initialKey'],
                "tags": song['normalizedTags']
            }
            for song in songs
        ]
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlist, f, indent=2, ensure_ascii=False)


def create_preset_playlist(db: List[Dict[str, Any]], preset_name: str, output_dir: str = "playlists", format: str = "m3u"):
    """Create a playlist from a preset recipe."""
    if preset_name not in PLAYLIST_RECIPES:
        print(f"Unknown preset: {preset_name}")
        print(f"Available presets: {', '.join(PLAYLIST_RECIPES.keys())}")
        return

    recipe = PLAYLIST_RECIPES[preset_name]
    print(f"Creating playlist: {recipe['name']}")
    print(f"Description: {recipe['description']}")
    print(f"Query: {recipe['query']}")

    results = search_by_tags(db, **recipe['query'])
    print(f"Found {len(results)} songs")

    if len(results) == 0:
        print("No songs found matching criteria!")
        return

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Generate filename
    filename = f"{preset_name}.{format}"
    full_path = output_path / filename

    # Create playlist
    if format == "m3u":
        create_m3u_playlist(results, str(full_path), recipe['name'], recipe['description'])
    elif format == "json":
        create_json_playlist(results, str(full_path), recipe['name'], recipe['description'])
    else:
        print(f"Unknown format: {format}")
        return

    print(f"Playlist saved to: {full_path}")


def create_custom_playlist(db: List[Dict[str, Any]], query_args: Dict[str, Any], name: str, output_dir: str = "playlists", format: str = "m3u"):
    """Create a custom playlist from query arguments."""
    print(f"Creating custom playlist: {name}")
    print(f"Query: {query_args}")

    # Parse query arguments
    query = {}
    for key, value in query_args.items():
        if ',' in value:
            query[key] = value.split(',')
        else:
            query[key] = [value]

    results = search_by_tags(db, **query)
    print(f"Found {len(results)} songs")

    if len(results) == 0:
        print("No songs found matching criteria!")
        return

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)

    # Generate filename
    safe_name = name.replace(' ', '_').replace('/', '-')
    filename = f"{safe_name}.{format}"
    full_path = output_path / filename

    # Create playlist
    if format == "m3u":
        create_m3u_playlist(results, str(full_path), name)
    elif format == "json":
        create_json_playlist(results, str(full_path), name)
    else:
        print(f"Unknown format: {format}")
        return

    print(f"Playlist saved to: {full_path}")


def list_presets():
    """List all available preset recipes."""
    print("\nAVAILABLE PRESET PLAYLISTS:")
    print("="*80)

    for key, recipe in PLAYLIST_RECIPES.items():
        print(f"\n{key}")
        print(f"  Name: {recipe['name']}")
        print(f"  Description: {recipe['description']}")
        print(f"  Query: {recipe['query']}")


def main():
    parser = argparse.ArgumentParser(description="Create playlists from tagged music database")

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # List presets command
    list_parser = subparsers.add_parser('list', help='List available preset playlists')

    # Preset playlist command
    preset_parser = subparsers.add_parser('preset', help='Create a preset playlist')
    preset_parser.add_argument('name', help='Preset name')
    preset_parser.add_argument('--format', choices=['m3u', 'json'], default='m3u', help='Output format')
    preset_parser.add_argument('--output-dir', default='playlists', help='Output directory')

    # Custom playlist command
    custom_parser = subparsers.add_parser('custom', help='Create a custom playlist')
    custom_parser.add_argument('--name', required=True, help='Playlist name')
    custom_parser.add_argument('--genre', help='Genre filter (comma-separated)')
    custom_parser.add_argument('--mood', help='Mood filter (comma-separated)')
    custom_parser.add_argument('--pace', help='Pace filter')
    custom_parser.add_argument('--energy', help='Energy filter')
    custom_parser.add_argument('--groove', help='Groove filter (comma-separated)')
    custom_parser.add_argument('--vocalSource', help='Vocal source filter (comma-separated)')
    custom_parser.add_argument('--vocalPresence', help='Vocal presence filter')
    custom_parser.add_argument('--style', help='Style filter (comma-separated)')
    custom_parser.add_argument('--format', choices=['m3u', 'json'], default='m3u', help='Output format')
    custom_parser.add_argument('--output-dir', default='playlists', help='Output directory')

    # All presets command
    all_parser = subparsers.add_parser('all', help='Create all preset playlists')
    all_parser.add_argument('--format', choices=['m3u', 'json'], default='m3u', help='Output format')
    all_parser.add_argument('--output-dir', default='playlists', help='Output directory')

    args = parser.parse_args()

    if args.command == 'list':
        list_presets()
        return

    # Load database
    script_dir = Path(__file__).parent
    db_path = script_dir / "musicTable_converted.json"
    print(f"Loading music database from {db_path}...")
    db = load_music_db(str(db_path))
    print(f"Loaded {len(db)} songs\n")

    if args.command == 'preset':
        create_preset_playlist(db, args.name, args.output_dir, args.format)

    elif args.command == 'custom':
        query_args = {
            k: v for k, v in vars(args).items()
            if k not in ['command', 'name', 'format', 'output_dir'] and v is not None
        }
        create_custom_playlist(db, query_args, args.name, args.output_dir, args.format)

    elif args.command == 'all':
        print("Creating all preset playlists...\n")
        for preset_name in PLAYLIST_RECIPES.keys():
            create_preset_playlist(db, preset_name, args.output_dir, args.format)
            print()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
