import Database from 'better-sqlite3';
import path from 'path';

/**
 * Music Tagger - Manages tags and tag groups for music database
 * Integrates with SQLite for persistent storage
 */

interface MusicTrack {
  id?: number;
  title: string;
  artist: string;
  album: string;
  originalGenre: string;
  bpm: number;
  initialKey: string;
  volume: string;
  speed: string;
  beats: string;
  age: string;
  vocals: string;
  instruments: string;
  funk: string;
  attitude: string;
  weight: string;
  pitch: string;
  melody: string;
  energy: string;
  voice: string;
  sounds: string;
  mood: string;
  genre: string;
  other: string;
  dir: string;
}

interface Tag {
  id: number;
  name: string;
  groupId: number;
  description?: string;
}

interface TagGroup {
  id: number;
  name: string;
  description?: string;
}

interface MusicTag {
  id?: number;
  musicId: number;
  tagId: number;
}

class MusicTagger {
  private db: Database.Database;
  private dbPath: string;

  constructor(dbPath: string = './music.db') {
    this.dbPath = dbPath;
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  /**
   * Initialize database tables
   */
  private initializeTables(): void {
    // Create tag_groups table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tag_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tags table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        group_id INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES tag_groups(id) ON DELETE CASCADE
      )
    `);

    // Create music table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS music (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        originalGenre TEXT,
        bpm INTEGER,
        initialKey TEXT,
        volume TEXT,
        speed TEXT,
        beats TEXT,
        age TEXT,
        vocals TEXT,
        instruments TEXT,
        funk TEXT,
        attitude TEXT,
        weight TEXT,
        pitch TEXT,
        melody TEXT,
        energy TEXT,
        voice TEXT,
        sounds TEXT,
        mood TEXT,
        genre TEXT,
        other TEXT,
        dir TEXT NOT NULL UNIQUE,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create music_tags junction table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS music_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        music_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (music_id) REFERENCES music(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(music_id, tag_id)
      )
    `);

    console.log('✓ Database tables initialized');
  }

  /**
   * Create a tag group
   */
  createTagGroup(name: string, description?: string): TagGroup {
    const stmt = this.db.prepare(`
      INSERT INTO tag_groups (name, description)
      VALUES (?, ?)
    `);
    const result = stmt.run(name, description || null);
    return { id: result.lastInsertRowid as number, name, description };
  }

  /**
   * Get all tag groups
   */
  getTagGroups(): TagGroup[] {
    const stmt = this.db.prepare('SELECT id, name, description FROM tag_groups ORDER BY name');
    return stmt.all() as TagGroup[];
  }

  /**
   * Create a tag
   */
  createTag(name: string, groupId: number, description?: string): Tag {
    const stmt = this.db.prepare(`
      INSERT INTO tags (name, group_id, description)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(name, groupId, description || null);
    return { id: result.lastInsertRowid as number, name, groupId, description };
  }

  /**
   * Get all tags
   */
  getTags(): Tag[] {
    const stmt = this.db.prepare(`
      SELECT id, name, groupId, description FROM tags ORDER BY groupId, name
    `);
    return stmt.all() as Tag[];
  }

  /**
   * Get tags by group
   */
  getTagsByGroup(groupId: number): Tag[] {
    const stmt = this.db.prepare(`
      SELECT id, name, groupId, description FROM tags WHERE group_id = ? ORDER BY name
    `);
    return stmt.all(groupId) as Tag[];
  }

  /**
   * Add a music track to the database
   */
  addMusic(track: MusicTrack): MusicTrack & { id: number } {
    const stmt = this.db.prepare(`
      INSERT INTO music (
        title, artist, album, originalGenre, bpm, initialKey, volume, speed, beats,
        age, vocals, instruments, funk, attitude, weight, pitch, melody, energy, voice,
        sounds, mood, genre, other, dir, name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      track.title, track.artist, track.album || null, track.originalGenre || null,
      track.bpm || null, track.initialKey || null, track.volume || null, track.speed || null,
      track.beats || null, track.age || null, track.vocals || null, track.instruments || null,
      track.funk || null, track.attitude || null, track.weight || null, track.pitch || null,
      track.melody || null, track.energy || null, track.voice || null, track.sounds || null,
      track.mood || null, track.genre || null, track.other || null, track.dir, track.title
    );

    return { ...track, id: result.lastInsertRowid as number };
  }

  /**
   * Get music by title
   */
  getMusicByTitle(title: string): (MusicTrack & { id: number }) | undefined {
    const stmt = this.db.prepare('SELECT * FROM music WHERE title = ?');
    return stmt.get(title) as (MusicTrack & { id: number }) | undefined;
  }

  /**
   * Get music by directory path
   */
  getMusicByDir(dir: string): (MusicTrack & { id: number }) | undefined {
    const stmt = this.db.prepare('SELECT * FROM music WHERE dir = ?');
    return stmt.get(dir) as (MusicTrack & { id: number }) | undefined;
  }

  /**
   * Get all music tracks
   */
  getAllMusic(): (MusicTrack & { id: number })[] {
    const stmt = this.db.prepare('SELECT * FROM music ORDER BY title');
    return stmt.all() as (MusicTrack & { id: number })[];
  }

  /**
   * Tag a music track
   */
  tagMusic(musicId: number, tagId: number): MusicTag {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO music_tags (music_id, tag_id)
      VALUES (?, ?)
    `);
    const result = stmt.run(musicId, tagId);
    return { music_id: musicId, tag_id: tagId } as any;
  }

  /**
   * Get tags for a music track
   */
  getTagsForMusic(musicId: number): Tag[] {
    const stmt = this.db.prepare(`
      SELECT t.id, t.name, t.group_id as groupId, t.description
      FROM tags t
      JOIN music_tags mt ON t.id = mt.tag_id
      WHERE mt.music_id = ?
      ORDER BY t.group_id, t.name
    `);
    return stmt.all(musicId) as Tag[];
  }

  /**
   * Get music with a specific tag
   */
  getMusicWithTag(tagId: number): (MusicTrack & { id: number })[] {
    const stmt = this.db.prepare(`
      SELECT m.*
      FROM music m
      JOIN music_tags mt ON m.id = mt.music_id
      WHERE mt.tag_id = ?
      ORDER BY m.title
    `);
    return stmt.all(tagId) as (MusicTrack & { id: number })[];
  }

  /**
   * Remove a tag from music
   */
  removeTagFromMusic(musicId: number, tagId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM music_tags WHERE music_id = ? AND tag_id = ?');
    const result = stmt.run(musicId, tagId);
    return result.changes > 0;
  }

  /**
   * Get music with multiple tags (AND condition)
   */
  getMusicWithAllTags(tagIds: number[]): (MusicTrack & { id: number })[] {
    if (tagIds.length === 0) return [];
    
    const placeholders = tagIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT m.*
      FROM music m
      WHERE m.id IN (
        SELECT music_id
        FROM music_tags
        WHERE tag_id IN (${placeholders})
        GROUP BY music_id
        HAVING COUNT(*) = ?
      )
      ORDER BY m.title
    `);
    return stmt.all(...tagIds, tagIds.length) as (MusicTrack & { id: number })[];
  }

  /**
   * Get music with any of the specified tags (OR condition)
   */
  getMusicWithAnyTag(tagIds: number[]): (MusicTrack & { id: number })[] {
    if (tagIds.length === 0) return [];
    
    const placeholders = tagIds.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT DISTINCT m.*
      FROM music m
      JOIN music_tags mt ON m.id = mt.music_id
      WHERE mt.tag_id IN (${placeholders})
      ORDER BY m.title
    `);
    return stmt.all(...tagIds) as (MusicTrack & { id: number })[];
  }

  /**
   * Get all music with their tags
   */
  getAllMusicWithTags() {
    const stmt = this.db.prepare(`
      SELECT m.id, m.title, m.artist, m.album, m.genre,
             GROUP_CONCAT(t.name, ', ') as tags,
             GROUP_CONCAT(tg.name, ', ') as tag_groups
      FROM music m
      LEFT JOIN music_tags mt ON m.id = mt.music_id
      LEFT JOIN tags t ON mt.tag_id = t.id
      LEFT JOIN tag_groups tg ON t.group_id = tg.id
      GROUP BY m.id
      ORDER BY m.title
    `);
    return stmt.all();
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Export database statistics
   */
  getStats() {
    const musicCount = (this.db.prepare('SELECT COUNT(*) as count FROM music').get() as any).count;
    const tagCount = (this.db.prepare('SELECT COUNT(*) as count FROM tags').get() as any).count;
    const groupCount = (this.db.prepare('SELECT COUNT(*) as count FROM tag_groups').get() as any).count;
    const taggedMusicCount = (this.db.prepare(`
      SELECT COUNT(DISTINCT music_id) as count FROM music_tags
    `).get() as any).count;

    return {
      totalMusic: musicCount,
      totalTags: tagCount,
      totalTagGroups: groupCount,
      taggedMusic: taggedMusicCount,
      untaggedMusic: musicCount - taggedMusicCount,
    };
  }
}

export { MusicTagger, MusicTrack, Tag, TagGroup, MusicTag };
