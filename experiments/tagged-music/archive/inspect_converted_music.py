#!/usr/bin/env python3
"""
Inspect and query the converted music database.
"""

import json
import random
from typing import List, Dict, Any, Optional
from pathlib import Path
from collections import Counter


def load_music_db(path: str = "musicTable_converted.json") -> List[Dict[str, Any]]:
    """Load the converted music database."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def show_random_samples(db: List[Dict[str, Any]], count: int = 5):
    """Show random sample conversions for verification."""
    print("\n" + "="*80)
    print(f"RANDOM SAMPLE OF {count} CONVERTED SONGS")
    print("="*80)

    samples = random.sample(db, min(count, len(db)))

    for i, song in enumerate(samples, 1):
        print(f"\n{i}. {song['artist']} - {song['title']}")
        print(f"   BPM: {song.get('bpm', 'N/A')} | Key: {song.get('initialKey', 'N/A')}")
        print(f"   Old tags: {', '.join(song['oldTags'])}")
        print(f"   Genre: {', '.join(song['normalizedTags']['genre']) or 'unknown'}")
        print(f"   Pace/Energy: {song['normalizedTags']['pace']}/{song['normalizedTags']['energy']}")
        print(f"   Groove: {', '.join(song['normalizedTags']['groove']) or 'none'}")
        print(f"   Mood: {', '.join(song['normalizedTags']['mood']) or 'none'}")
        print(f"   Vocal: {song['normalizedTags']['vocalPresence']}")
        if song['normalizedTags']['vocalSource']:
            print(f"   Voice: {', '.join(song['normalizedTags']['vocalSource'])}")
        if song['normalizedTags']['flags']:
            print(f"   Flags: {', '.join(song['normalizedTags']['flags'])}")


def show_genre_stats(db: List[Dict[str, Any]]):
    """Show genre distribution statistics."""
    print("\n" + "="*80)
    print("GENRE DISTRIBUTION")
    print("="*80)

    genre_counter = Counter()
    for song in db:
        for genre in song['normalizedTags']['genre']:
            genre_counter[genre] += 1

    print(f"\nTotal genres: {len(genre_counter)}")
    print("\nTop genres:")
    for genre, count in genre_counter.most_common(20):
        percentage = (count / len(db)) * 100
        print(f"  {genre:20} {count:4} songs ({percentage:5.1f}%)")


def show_mood_stats(db: List[Dict[str, Any]]):
    """Show mood distribution statistics."""
    print("\n" + "="*80)
    print("MOOD DISTRIBUTION")
    print("="*80)

    mood_counter = Counter()
    for song in db:
        for mood in song['normalizedTags']['mood']:
            mood_counter[mood] += 1

    print(f"\nTotal moods: {len(mood_counter)}")
    print("\nMood distribution:")
    for mood, count in mood_counter.most_common():
        percentage = (count / len(db)) * 100
        print(f"  {mood:20} {count:4} songs ({percentage:5.1f}%)")


def show_vocal_stats(db: List[Dict[str, Any]]):
    """Show vocal presence statistics."""
    print("\n" + "="*80)
    print("VOCAL PRESENCE STATISTICS")
    print("="*80)

    vocal_counter = Counter()
    for song in db:
        vocal_counter[song['normalizedTags']['vocalPresence']] += 1

    print("\nVocal presence:")
    for presence, count in vocal_counter.most_common():
        percentage = (count / len(db)) * 100
        print(f"  {presence:20} {count:4} songs ({percentage:5.1f}%)")

    print("\n" + "-"*80)
    print("VOCAL SOURCE STATISTICS (for songs with vocals)")
    print("-"*80)

    source_counter = Counter()
    for song in db:
        if song['normalizedTags']['vocalPresence'] in ['vocal', 'mostly-instrumental']:
            for source in song['normalizedTags']['vocalSource']:
                source_counter[source] += 1

    print("\nVocal sources:")
    for source, count in source_counter.most_common():
        print(f"  {source:20} {count:4} occurrences")


def show_energy_pace_stats(db: List[Dict[str, Any]]):
    """Show energy and pace distribution."""
    print("\n" + "="*80)
    print("ENERGY & PACE DISTRIBUTION")
    print("="*80)

    pace_counter = Counter()
    energy_counter = Counter()

    for song in db:
        pace_counter[song['normalizedTags']['pace']] += 1
        energy_counter[song['normalizedTags']['energy']] += 1

    print("\nPace distribution:")
    for pace in ['slow', 'mid', 'fast', 'unknown']:
        count = pace_counter[pace]
        percentage = (count / len(db)) * 100
        print(f"  {pace:10} {count:4} songs ({percentage:5.1f}%)")

    print("\nEnergy distribution:")
    for energy in ['low', 'medium', 'high', 'peak', 'unknown']:
        count = energy_counter[energy]
        percentage = (count / len(db)) * 100
        print(f"  {energy:10} {count:4} songs ({percentage:5.1f}%)")


def show_flags_stats(db: List[Dict[str, Any]]):
    """Show flag statistics."""
    print("\n" + "="*80)
    print("FLAGS STATISTICS")
    print("="*80)

    flag_counter = Counter()
    for song in db:
        for flag in song['normalizedTags']['flags']:
            flag_counter[flag] += 1

    print(f"\nSongs with flags: {sum(1 for s in db if s['normalizedTags']['flags'])}")
    print("\nFlag distribution:")
    for flag, count in flag_counter.most_common():
        print(f"  {flag:30} {count:4} songs")


def search_by_tags(db: List[Dict[str, Any]], **criteria) -> List[Dict[str, Any]]:
    """
    Search songs by normalized tag criteria.

    Example:
        search_by_tags(db, genre=['house'], mood=['positive'], vocalSource=['female'])
    """
    results = []

    for song in db:
        tags = song['normalizedTags']
        match = True

        for key, values in criteria.items():
            if not isinstance(values, list):
                values = [values]

            if key in ['pace', 'energy', 'weight', 'vocalPresence', 'repetition', 'progression']:
                # Scalar fields - exact match
                if tags[key] not in values:
                    match = False
                    break
            else:
                # Array fields - check intersection
                if not any(v in tags.get(key, []) for v in values):
                    match = False
                    break

        if match:
            results.append(song)

    return results


def show_search_example(db: List[Dict[str, Any]]):
    """Show an example search."""
    print("\n" + "="*80)
    print("EXAMPLE SEARCH: Funky House with Female Vocals")
    print("="*80)

    results = search_by_tags(
        db,
        genre=['house'],
        groove=['funky'],
        vocalSource=['female']
    )

    print(f"\nFound {len(results)} songs")

    for i, song in enumerate(results[:10], 1):
        print(f"\n{i}. {song['artist']} - {song['title']}")
        print(f"   Mood: {', '.join(song['normalizedTags']['mood']) or 'none'}")
        print(f"   Style: {', '.join(song['normalizedTags']['style']) or 'none'}")


def show_bpm_analysis(db: List[Dict[str, Any]]):
    """Show BPM analysis and potential issues."""
    print("\n" + "="*80)
    print("BPM ANALYSIS")
    print("="*80)

    bpms = [s['bpm'] for s in db if s['bpm']]
    missing_bpm = [s for s in db if not s['bpm']]

    print(f"\nSongs with BPM: {len(bpms)}")
    print(f"Songs missing BPM: {len(missing_bpm)}")

    if bpms:
        print(f"\nBPM range: {min(bpms):.0f} - {max(bpms):.0f}")
        print(f"Average BPM: {sum(bpms)/len(bpms):.1f}")

        # BPM distribution
        bpm_ranges = {
            'Very Slow (< 85)': [b for b in bpms if b < 85],
            'Slow (85-100)': [b for b in bpms if 85 <= b < 100],
            'Mid (100-115)': [b for b in bpms if 100 <= b < 115],
            'Mid-Fast (115-130)': [b for b in bpms if 115 <= b < 130],
            'Fast (130-145)': [b for b in bpms if 130 <= b < 145],
            'Very Fast (145-175)': [b for b in bpms if 145 <= b < 175],
            'Extreme (175+)': [b for b in bpms if b >= 175],
        }

        print("\nBPM distribution:")
        for range_name, values in bpm_ranges.items():
            if values:
                percentage = (len(values) / len(bpms)) * 100
                print(f"  {range_name:20} {len(values):4} songs ({percentage:5.1f}%)")

    # Songs flagged with BPM issues
    bpm_flagged = [s for s in db if any('bpm' in f for f in s['normalizedTags']['flags'])]
    if bpm_flagged:
        print(f"\nSongs with BPM-related flags: {len(bpm_flagged)}")


def main():
    """Main inspection program."""
    script_dir = Path(__file__).parent
    db_path = script_dir / "musicTable_converted.json"

    print("Loading music database...")
    db = load_music_db(str(db_path))
    print(f"Loaded {len(db)} songs")

    # Show various statistics
    show_random_samples(db, 5)
    show_genre_stats(db)
    show_mood_stats(db)
    show_vocal_stats(db)
    show_energy_pace_stats(db)
    show_flags_stats(db)
    show_bpm_analysis(db)
    show_search_example(db)

    print("\n" + "="*80)
    print("INSPECTION COMPLETE")
    print("="*80)
    print("\nYou can use this script programmatically:")
    print("  from inspect_converted_music import load_music_db, search_by_tags")
    print("  db = load_music_db()")
    print("  results = search_by_tags(db, genre=['house'], mood=['positive'])")


if __name__ == "__main__":
    main()
