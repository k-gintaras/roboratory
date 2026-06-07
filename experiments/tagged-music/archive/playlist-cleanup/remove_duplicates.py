#!/usr/bin/env python3
"""
Remove duplicate/similar tracks from to-remove-if-in-tagged.txt
that already exist in tagged-already.txt
"""

from difflib import SequenceMatcher
import re


def normalize_track_name(name):
    """Normalize track name for better comparison"""
    # Remove extra whitespace
    name = ' '.join(name.split())
    # Convert to lowercase for comparison
    name = name.lower()
    return name


def similarity_ratio(str1, str2):
    """Calculate similarity ratio between two strings"""
    return SequenceMatcher(None, str1, str2).ratio()


def extract_core_track(track):
    """Extract core artist and track name, removing extra info in parens at the end"""
    # Remove things like "(Extended Mix)", "(Remix)", etc. at the end
    # But keep things like "ft. Artist" or artist names with parens
    core = re.sub(r'\s*\([^)]*(?:Remix|Mix|Extended|Edit|Version)\)\s*$', '', track, flags=re.IGNORECASE)
    return core.strip()


def is_similar_track(track1, track2, threshold=0.88):
    """
    Check if two tracks are similar enough to be considered duplicates
    threshold: 0.88 means 88% similarity (stricter for fuzzy matching)
    """
    norm1 = normalize_track_name(track1)
    norm2 = normalize_track_name(track2)

    # Check exact match first
    if norm1 == norm2:
        return True, 1.0

    # Check similarity ratio
    ratio = similarity_ratio(norm1, norm2)
    if ratio >= threshold:
        return True, ratio

    # Check core track names (without remix/extended info)
    core1 = normalize_track_name(extract_core_track(track1))
    core2 = normalize_track_name(extract_core_track(track2))

    if core1 == core2:
        return True, 0.95

    core_ratio = similarity_ratio(core1, core2)
    if core_ratio >= threshold:
        return True, core_ratio

    # Check if one is contained in the other (for cases like "Song" vs "Song (Remix)")
    if len(norm1) > 30 and len(norm2) > 30:  # Only for reasonably long names
        if norm1 in norm2 or norm2 in norm1:
            # Make sure they share the artist and track name
            if '–' in norm1 and '–' in norm2:
                artist1 = norm1.split('–')[0].strip()
                artist2 = norm2.split('–')[0].strip()
                # Artists should be similar
                if similarity_ratio(artist1, artist2) >= 0.85:
                    return True, 0.92

    return False, ratio


def parse_file(filepath):
    """Parse a file with format: number→Artist – Track"""
    tracks = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                # Remove line numbers and arrow (→ or ->)
                match = re.match(r'\s*\d+\s*(?:→|->)\s*(.+)', line)
                if match:
                    track = match.group(1).strip()
                    tracks.append(track)
                elif '–' in line:  # If no number found but has the dash separator
                    tracks.append(line)
    return tracks


def main():
    # Read both files
    print("Reading tagged-already.txt...")
    already_tagged = parse_file('tagged-already.txt')
    print(f"Found {len(already_tagged)} already tagged tracks")

    print("\nReading to-remove-if-in-tagged.txt...")
    to_check = parse_file('to-remove-if-in-tagged.txt')
    print(f"Found {len(to_check)} tracks to check")

    # Find duplicates
    print("\nFinding duplicates (this may take a moment)...")
    duplicates = []
    unique_tracks = []

    for i, track_to_check in enumerate(to_check):
        if (i + 1) % 20 == 0:
            print(f"Checking track {i+1}/{len(to_check)}...")

        is_duplicate = False
        best_match = None
        best_ratio = 0

        for tagged_track in already_tagged:
            similar, ratio = is_similar_track(track_to_check, tagged_track)
            if similar:
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = tagged_track
                is_duplicate = True

        if is_duplicate:
            duplicates.append({
                'track': track_to_check,
                'matches': best_match,
                'similarity': best_ratio
            })
        else:
            unique_tracks.append(track_to_check)

    # Report findings
    print(f"\n{'='*80}")
    print(f"RESULTS:")
    print(f"{'='*80}")
    print(f"Total tracks to check: {len(to_check)}")
    print(f"Duplicates found: {len(duplicates)}")
    print(f"Unique tracks remaining: {len(unique_tracks)}")

    # Show duplicates
    if duplicates:
        print(f"\n{'='*80}")
        print("DUPLICATES FOUND (will be removed):")
        print(f"{'='*80}")
        for dup in duplicates:
            print(f"\n  Track: {dup['track']}")
            print(f"  Matches: {dup['matches']}")
            print(f"  Similarity: {dup['similarity']:.2%}")

    # Save unique tracks
    output_file = 'to-remove-if-in-tagged_CLEANED.txt'
    print(f"\n{'='*80}")
    print(f"Saving {len(unique_tracks)} unique tracks to: {output_file}")
    print(f"{'='*80}")

    with open(output_file, 'w', encoding='utf-8') as f:
        for i, track in enumerate(unique_tracks, 1):
            f.write(f"{i}\t{track}\n")

    print(f"\n[OK] Done! Check {output_file} for the cleaned list.")

    # Also save a report of duplicates
    if duplicates:
        report_file = 'duplicates_report.txt'
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("DUPLICATE TRACKS REMOVED\n")
            f.write("="*80 + "\n\n")
            for dup in duplicates:
                f.write(f"Track: {dup['track']}\n")
                f.write(f"Matches: {dup['matches']}\n")
                f.write(f"Similarity: {dup['similarity']:.2%}\n")
                f.write("-"*80 + "\n")
        print(f"[OK] Duplicates report saved to: {report_file}")


if __name__ == '__main__':
    main()
