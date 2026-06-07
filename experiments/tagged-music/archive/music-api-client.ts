import axios, { AxiosInstance } from 'axios';
import { MusicTagger } from './music-tagger';

/**
 * Music API Client
 * Handles integration with the music API at http://192.168.4.41:4001/
 */

interface ApiMusicTrack {
  id: string;
  name: string;
  title: string;
  artist: string;
  album: string;
  dir: string;
  [key: string]: any;
}

interface ApiTag {
  id: string;
  name: string;
  groupId: string;
}

interface ApiTagGroup {
  id: string;
  name: string;
}

class MusicAPIClient {
  private api: AxiosInstance;
  private baseURL: string;
  private tagger: MusicTagger;

  constructor(baseURL: string = 'http://192.168.4.41:4001', dbPath: string = './music.db') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.tagger = new MusicTagger(dbPath);
  }

  /**
   * Test connection to API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/api-docs/');
      console.log('✓ Connected to API:', this.baseURL);
      return true;
    } catch (err) {
      console.error('✗ Failed to connect to API:', (err as any).message);
      return false;
    }
  }

  /**
   * Get all music files from API
   */
  async getMusic(): Promise<ApiMusicTrack[]> {
    try {
      const response = await this.api.get('/api/music');
      console.log(`✓ Retrieved ${response.data.length} tracks from API`);
      return response.data;
    } catch (err) {
      console.error('✗ Failed to get music:', (err as any).message);
      throw err;
    }
  }

  /**
   * Get specific music file
   */
  async getMusicById(id: string): Promise<ApiMusicTrack> {
    try {
      const response = await this.api.get(`/api/music/${id}`);
      return response.data;
    } catch (err) {
      console.error(`✗ Failed to get music ${id}:`, (err as any).message);
      throw err;
    }
  }

  /**
   * Sync local database with API music files
   */
  async syncMusicWithAPI(): Promise<{ added: number; updated: number; skipped: number }> {
    console.log('\n🔄 Syncing music database with API...');
    
    try {
      const apiMusic = await this.getMusic();
      let added = 0;
      let updated = 0;
      let skipped = 0;

      for (const track of apiMusic) {
        try {
          const existing = this.tagger.getMusicByDir(track.dir);
          
          if (!existing) {
            this.tagger.addMusic({
              title: track.title || track.name,
              artist: track.artist || '',
              album: track.album || '',
              originalGenre: track.originalGenre || '',
              bpm: track.bpm ? parseInt(track.bpm) : null,
              initialKey: track.initialKey || '',
              volume: track.volume || '',
              speed: track.speed || '',
              beats: track.beats || '',
              age: track.age || '',
              vocals: track.vocals || '',
              instruments: track.instruments || '',
              funk: track.funk || '',
              attitude: track.attitude || '',
              weight: track.weight || '',
              pitch: track.pitch || '',
              melody: track.melody || '',
              energy: track.energy || '',
              voice: track.voice || '',
              sounds: track.sounds || '',
              mood: track.mood || '',
              genre: track.genre || '',
              other: track.other || '',
              dir: track.dir,
            });
            added++;
          } else {
            updated++;
          }
        } catch (err) {
          console.warn(`⚠️  Skipped: ${track.title} - ${(err as any).message}`);
          skipped++;
        }
      }

      console.log(`✓ Sync complete: Added ${added}, Updated ${updated}, Skipped ${skipped}`);
      return { added, updated, skipped };
    } catch (err) {
      console.error('✗ Sync failed:', (err as any).message);
      throw err;
    }
  }

  /**
   * Get tag groups from local database
   */
  getTagGroups() {
    return this.tagger.getTagGroups();
  }

  /**
   * Get tags from local database
   */
  getTags() {
    return this.tagger.getTags();
  }

  /**
   * Create a tag group
   */
  createTagGroup(name: string, description?: string) {
    return this.tagger.createTagGroup(name, description);
  }

  /**
   * Create a tag
   */
  createTag(name: string, groupId: number, description?: string) {
    return this.tagger.createTag(name, groupId, description);
  }

  /**
   * Tag a music track in local database
   */
  tagMusic(musicId: number, tagId: number) {
    return this.tagger.tagMusic(musicId, tagId);
  }

  /**
   * Get tags for a music track
   */
  getTagsForMusic(musicId: number) {
    return this.tagger.getTagsForMusic(musicId);
  }

  /**
   * Get music with a specific tag
   */
  getMusicWithTag(tagId: number) {
    return this.tagger.getMusicWithTag(tagId);
  }

  /**
   * Remove a tag from music
   */
  removeTagFromMusic(musicId: number, tagId: number) {
    return this.tagger.removeTagFromMusic(musicId, tagId);
  }

  /**
   * Get all music with their tags
   */
  getAllMusicWithTags() {
    return this.tagger.getAllMusicWithTags();
  }

  /**
   * Get database statistics
   */
  getStats() {
    return this.tagger.getStats();
  }

  /**
   * Export tags in API format (if needed)
   */
  exportTagsForAPI(): ApiTag[] {
    const tags = this.tagger.getTags();
    return tags.map(tag => ({
      id: String(tag.id),
      name: tag.name,
      groupId: String(tag.groupId),
    }));
  }

  /**
   * Close database connection
   */
  close(): void {
    this.tagger.close();
  }
}

export { MusicAPIClient, ApiMusicTrack, ApiTag, ApiTagGroup };
