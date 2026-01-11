# Music Tagger - SQLite Tagging System

A TypeScript system for managing music with tags and tag groups using SQLite. Integrates with your music API at `http://192.168.4.41:4001/`.

## Features

- ✅ **Tag Management**: Create and organize tags into groups
- ✅ **Music Tagging**: Tag music tracks with multiple tags
- ✅ **Query Support**: Find music by tags (AND/OR conditions)
- ✅ **API Integration**: Sync with music API and manage metadata
- ✅ **CSV Import**: Load music from CSV files
- ✅ **Database Stats**: Track tagging coverage

## Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

## Database Schema

### Tables

**tag_groups**
- `id`: Primary key
- `name`: Unique group name
- `description`: Optional description

**tags**
- `id`: Primary key
- `name`: Unique tag name
- `group_id`: Foreign key to tag_groups
- `description`: Optional description

**music**
- `id`: Primary key
- `title`, `artist`, `album`: Track metadata
- `dir`: Unique file path
- All metadata columns from your CSV
- `name`: Optional alternative name

**music_tags** (junction table)
- `music_id`: Foreign key to music
- `tag_id`: Foreign key to tags
- Unique constraint on (music_id, tag_id)

## Usage Examples

### Basic Setup

```typescript
import { MusicTagger } from './music-tagger';

const tagger = new MusicTagger('./music.db');

// Create tag groups
const moodGroup = tagger.createTagGroup('Mood', 'How the music makes you feel');
const genreGroup = tagger.createTagGroup('Genre', 'Music genres');

// Create tags
const happyTag = tagger.createTag('happy', moodGroup.id);
const rockTag = tagger.createTag('rock', genreGroup.id);

// Add music
const track = tagger.addMusic({
  title: 'My Song',
  artist: 'Artist Name',
  album: 'Album Name',
  dir: '/path/to/song.mp3',
  // ... other fields
});

// Tag the music
tagger.tagMusic(track.id, happyTag.id);
tagger.tagMusic(track.id, rockTag.id);

// Get tags for a track
const tags = tagger.getTagsForMusic(track.id);
console.log(tags); // [{ id: 1, name: 'happy', ... }, { id: 2, name: 'rock', ... }]

tagger.close();
```

### API Integration

```typescript
import { MusicAPIClient } from './music-api-client';

const client = new MusicAPIClient('http://192.168.4.41:4001');

// Test connection
const connected = await client.testConnection();

// Sync music from API
const syncResult = await client.syncMusicWithAPI();
console.log(`Added: ${syncResult.added}, Updated: ${syncResult.updated}`);

// Create tags
const moodGroup = client.createTagGroup('Mood');
const energeticTag = client.createTag('energetic', moodGroup.id);

// Tag music
client.tagMusic(1, energeticTag.id);

// Query music
const energeticMusic = client.getMusicWithTag(energeticTag.id);

// Get stats
const stats = client.getStats();
console.log(stats);
// {
//   totalMusic: 1000,
//   totalTags: 50,
//   totalTagGroups: 8,
//   taggedMusic: 750,
//   untaggedMusic: 250
// }

client.close();
```

### Advanced Queries

```typescript
// Get music with ALL specified tags (AND condition)
const happyRockTracks = tagger.getMusicWithAllTags([happyTag.id, rockTag.id]);

// Get music with ANY of the tags (OR condition)
const musicWithMoodOrGenre = tagger.getMusicWithAnyTag([happyTag.id, rockTag.id]);

// Get all music with their tags
const allMusicWithTags = tagger.getAllMusicWithTags();
// Returns: [
//   { id: 1, title: 'Song 1', tags: 'happy, rock', tag_groups: 'Mood, Genre' },
//   { id: 2, title: 'Song 2', tags: 'sad', tag_groups: 'Mood' },
// ]

// Get tags by group
const moodTags = tagger.getTagsByGroup(moodGroup.id);
```

### Setup & Demo

Run the setup demo to initialize with default tags:

```bash
npm run setup
```

This will:
1. Load music from `musicTable.csv`
2. Create default tag groups (Mood, Genre, Instrumentation, etc.)
3. Tag some sample tracks
4. Display statistics

## API Tag Groups (Predefined)

The setup includes these standard tag groups:

- **Mood**: happy, sad, calm, energetic, angry, melancholic, uplifting, relaxing, tense, peaceful, intense
- **Genre**: rock, pop, hip-hop, electronic, house, trance, classical, jazz, blues, country, metal, rap, indie, alternative, techno, ambient, chillout
- **Instrumentation**: vocal, guitar, piano, drums, synth, strings, brass, electronic, acoustic, bass, woodwinds
- **Tempo**: slow, moderate, fast, progressive, rhythmic
- **Style**: melodic, minimal, epic, beautiful, funky, cool, timeless, modern, atmospheric, dance
- **Vocals**: male, female, male-female, male-vocal, female-vocal, instrumental, acapella
- **Energy**: active, passive, high-energy, low-energy
- **Vibe**: positive, negative, neutral, cute, serious, funny, dark, light, heavy, gentle

## CSV Import Format

The system expects CSV files with these columns (as per your musicTable.csv):

```
title,artist,album,originalGenre,bpm,initialKey,volume,speed,beats,age,vocals,instruments,funk,attitude,weight,pitch,melody,energy,voice,sounds,mood,genre,other,dir
```

## Debugging

The system includes comprehensive logging. Enable debug mode:

```typescript
// All operations log to console
// Look for ✓, ✗, ⚠️  symbols in output
```

## Common Operations

### Remove a tag from music
```typescript
tagger.removeTagFromMusic(musicId, tagId);
```

### Get music by title or directory
```typescript
const track = tagger.getMusicByTitle('My Song');
const track2 = tagger.getMusicByDir('/path/to/song.mp3');
```

### Export tags for API
```typescript
const apiTags = client.exportTagsForAPI();
```

## File Structure

```
tagged-music/
├── music-tagger.ts         # Core tagging engine
├── music-api-client.ts     # API integration
├── setup-demo.ts           # Setup and demo script
├── package.json
├── tsconfig.json
├── musicTable.csv          # Source music data
└── music.db                # SQLite database (created on first run)
```

## Next Steps

1. **Run setup**: `npm run setup`
2. **Debug if needed**: Check console output for errors
3. **Extend with API**: Integrate with your server's tag endpoints
4. **Build and Deploy**: `npm run build`

## Notes

- All music tracks must have a unique `dir` (file path)
- Tags are unique by name across all groups
- Use UNIQUE constraints to prevent duplicate tagging
- Database uses WAL (Write-Ahead Logging) mode for better concurrency

## License

MIT
