import { MusicTagger } from './music-tagger';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';

/**
 * Music Tagger Demo/Setup Script
 * This loads music from CSV and demonstrates tagging functionality
 */

async function loadMusicFromCSV(tagger: MusicTagger, csvPath: string): Promise<void> {
  const musicData: any[] = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        musicData.push(row);
      })
      .on('end', () => {
        console.log(`\n📊 Loading ${musicData.length} tracks from CSV...`);
        let addedCount = 0;
        
        for (const row of musicData) {
          try {
            // Check if music already exists
            const existing = tagger.getMusicByDir(row.dir);
            if (!existing) {
              tagger.addMusic({
                title: row.title,
                artist: row.artist,
                album: row.album || '',
                originalGenre: row.originalGenre || '',
                bpm: row.bpm ? parseInt(row.bpm) : null,
                initialKey: row.initialKey || '',
                volume: row.volume || '',
                speed: row.speed || '',
                beats: row.beats || '',
                age: row.age || '',
                vocals: row.vocals || '',
                instruments: row.instruments || '',
                funk: row.funk || '',
                attitude: row.attitude || '',
                weight: row.weight || '',
                pitch: row.pitch || '',
                melody: row.melody || '',
                energy: row.energy || '',
                voice: row.voice || '',
                sounds: row.sounds || '',
                mood: row.mood || '',
                genre: row.genre || '',
                other: row.other || '',
                dir: row.dir,
              });
              addedCount++;
            }
          } catch (err) {
            console.warn(`⚠️  Skipped track: ${row.title} (${(err as any).message})`);
          }
        }
        console.log(`✓ Added ${addedCount} new tracks to database`);
        resolve();
      })
      .on('error', reject);
  });
}

async function setupDefaultTags(tagger: MusicTagger): Promise<void> {
  console.log('\n🏷️  Setting up default tag groups and tags...');
  
  // Define tag groups and their tags
  const tagStructure = {
    'Mood': [
      'happy', 'sad', 'calm', 'energetic', 'angry', 'melancholic',
      'uplifting', 'relaxing', 'tense', 'peaceful', 'intense'
    ],
    'Genre': [
      'rock', 'pop', 'hip-hop', 'electronic', 'house', 'trance',
      'classical', 'jazz', 'blues', 'country', 'metal', 'rap',
      'indie', 'alternative', 'techno', 'ambient', 'chillout'
    ],
    'Instrumentation': [
      'vocal', 'guitar', 'piano', 'drums', 'synth', 'strings',
      'brass', 'electronic', 'acoustic', 'bass', 'woodwinds'
    ],
    'Tempo': [
      'slow', 'moderate', 'fast', 'progressive', 'rhythmic'
    ],
    'Style': [
      'melodic', 'minimal', 'epic', 'beautiful', 'funky',
      'cool', 'timeless', 'modern', 'atmospheric', 'dance'
    ],
    'Vocals': [
      'male', 'female', 'male-female', 'male-vocal', 'female-vocal',
      'instrumental', 'acapella'
    ],
    'Energy': [
      'active', 'passive', 'high-energy', 'low-energy'
    ],
    'Vibe': [
      'positive', 'negative', 'neutral', 'cute', 'serious',
      'funny', 'dark', 'light', 'heavy', 'gentle'
    ],
  };

  for (const [groupName, tags] of Object.entries(tagStructure)) {
    try {
      const group = tagger.createTagGroup(groupName);
      console.log(`  ✓ Created group: ${groupName}`);
      
      for (const tagName of tags) {
        try {
          tagger.createTag(tagName, group.id);
        } catch (err) {
          // Tag might already exist, skip
        }
      }
      console.log(`    └─ Added ${tags.length} tags`);
    } catch (err) {
      // Group might already exist, skip
    }
  }
}

async function demonstrateTagging(tagger: MusicTagger): Promise<void> {
  console.log('\n🎵 Demonstrating tagging functionality...');
  
  const allMusic = tagger.getAllMusic();
  if (allMusic.length === 0) {
    console.log('No music tracks in database');
    return;
  }

  const allTags = tagger.getTags();
  if (allTags.length === 0) {
    console.log('No tags created');
    return;
  }

  // Tag first 5 tracks with random tags
  const tracksToTag = allMusic.slice(0, Math.min(5, allMusic.length));
  
  for (const track of tracksToTag) {
    // Get 2-4 random tags
    const randomTags = allTags.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 2);
    
    for (const tag of randomTags) {
      try {
        tagger.tagMusic(track.id!, tag.id);
      } catch (err) {
        // Tag might already exist
      }
    }
    
    const assignedTags = tagger.getTagsForMusic(track.id!);
    console.log(`  📍 ${track.title}: ${assignedTags.map(t => t.name).join(', ')}`);
  }
}

async function main(): Promise<void> {
  console.log('🎼 Music Tagger Setup\n');
  
  const dbPath = path.join(__dirname, 'music.db');
  const csvPath = path.join(__dirname, 'musicTable.csv');
  
  const tagger = new MusicTagger(dbPath);
  
  try {
    // Load music from CSV if it exists
    if (fs.existsSync(csvPath)) {
      await loadMusicFromCSV(tagger, csvPath);
    } else {
      console.log('⚠️  CSV file not found, skipping music import');
    }

    // Setup default tags
    await setupDefaultTags(tagger);

    // Demonstrate tagging
    await demonstrateTagging(tagger);

    // Show statistics
    const stats = tagger.getStats();
    console.log('\n📈 Database Statistics:');
    console.log(`  • Total Tracks: ${stats.totalMusic}`);
    console.log(`  • Total Tags: ${stats.totalTags}`);
    console.log(`  • Tag Groups: ${stats.totalTagGroups}`);
    console.log(`  • Tagged Tracks: ${stats.taggedMusic}`);
    console.log(`  • Untagged Tracks: ${stats.untaggedMusic}`);

    // Show sample of music with tags
    console.log('\n🏷️  Sample of tagged music:');
    const musicWithTags = tagger.getAllMusicWithTags().slice(0, 5);
    for (const item of musicWithTags) {
      console.log(`  • ${(item as any).title} - ${(item as any).tags || 'no tags'}`);
    }

    console.log('\n✅ Setup complete! Database ready at:', dbPath);

  } finally {
    tagger.close();
  }
}

// Run the demo
main().catch(console.error);
