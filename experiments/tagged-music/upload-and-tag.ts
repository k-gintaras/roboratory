import axios, { AxiosInstance } from 'axios';
import sqlite3 from 'sqlite3';
import path from 'path';

/**
 * Music Upload & Tagging System
 * 
 * Two-stage process:
 * Stage 1: Create tag groups (all columns) and tags via API
 * Stage 2: Tag each music item by matching filename with API items
 */

interface LocalMusicTrack {
  [key: string]: any;
}

interface ApiTagGroup {
  id: string;
  name: string;
}

interface ApiTag {
  id: string;
  name: string;
  groupId: string;
}

interface ApiMusicItem {
  id: string;
  name: string;
  [key: string]: any;
}

class MusicUploadTagger {
  private db: sqlite3.Database;
  private api: AxiosInstance;
  private baseURL: string;
  private tagGroupsCache: Map<string, ApiTagGroup> = new Map();
  private tagsCache: Map<string, ApiTag> = new Map();
  private apiMusicCache: ApiMusicItem[] | null = null;

  constructor(
    dbPath: string = './musicData',
    apiBaseURL: string = 'http://192.168.4.41:4001'
  ) {
    this.db = new sqlite3.Database(dbPath);
    this.baseURL = apiBaseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Promisified database query
   */
  private dbRun(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Promisified database all
   */
  private dbAll(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Promisified database get
   */
  private dbGet(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Extract filename from directory path (without extension)
   */
  private getFilenameFromPath(dirPath: string): string | null {
    if (!dirPath) return null;
    const filename = path.basename(dirPath);
    const nameWithoutExt = path.parse(filename).name;
    return nameWithoutExt.trim();
  }

  /**
   * Get all music from local SQLite
   */
  private async getLocalMusic(): Promise<LocalMusicTrack[]> {
    return this.dbAll('SELECT * FROM musicTable ORDER BY title');
  }

  /**
   * Get all column names from musicTable (excluding dir and id)
   */
  private async getAllColumnNames(): Promise<string[]> {
    const result = await this.dbAll("PRAGMA table_info(musicTable)");
    const excludedColumns = ['id', 'dir'];
    return result
      .map((col: any) => col.name)
      .filter(name => !excludedColumns.includes(name));
  }

  /**
   * Get unique values from a column
   */
  private async getUniqueColumnValues(columnName: string): Promise<string[]> {
    const result = await this.dbAll(
      `SELECT DISTINCT ${columnName} FROM musicTable WHERE ${columnName} IS NOT NULL AND ${columnName} != '' ORDER BY ${columnName}`
    );
    return result
      .map(r => r[columnName])
      .filter(v => v && String(v).trim())
      .map(v => String(v).trim())
      .sort();
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.api.get('/api-docs/');
      console.log('✓ Connected to API:', this.baseURL);
      
      // Test the items endpoint
      console.log('\n📋 Checking API endpoints...');
      try {
        const itemsTest = await this.api.get('/api/items');
        console.log(`  ✓ Found /api/items endpoint (${(itemsTest.data || []).length} items)`);
      } catch (e) {
        console.log('  ⚠️  /api/items not available');
      }
      
      return true;
    } catch (err) {
      console.error('✗ Failed to connect to API:', (err as any).message);
      return false;
    }
  }

  /**
   * STAGE 1: Create tag groups and tags via API
   */
  async createTagGroupsAndTags(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 STAGE 1: Creating Tag Groups & Tags');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get all column names from music table
    const columnNames = await this.getAllColumnNames();
    console.log(`📋 Found ${columnNames.length} columns to create tag groups for\n`);

    for (const columnName of columnNames) {
      console.log(`🏷️  Creating tag group: "${columnName}"`);

      try {
        // Create tag group
        const groupResponse = await this.api.post('/api/tag-groups', {
          name: columnName,
          description: `Tags for ${columnName}`,
        });

        const group = groupResponse.data as ApiTagGroup;
        this.tagGroupsCache.set(columnName, group);
        console.log(`  ✓ Created group: ${columnName} (ID: ${group.id})`);

        // Get unique values for this column
        const uniqueValues = await this.getUniqueColumnValues(columnName);
        console.log(`  📊 Found ${uniqueValues.length} unique ${columnName} values`);

        // Create tags for each unique value
        let createdTags = 0;
        let skippedTags = 0;
        for (const value of uniqueValues) {
          try {
            const tagResponse = await this.api.post('/api/tags', {
              name: value,
              groupId: group.id,
              description: `${columnName}: ${value}`,
            });

            const tag = tagResponse.data as ApiTag;
            const cacheKey = `${columnName}:${value}`;
            this.tagsCache.set(cacheKey, tag);
            createdTags++;

            // Log progress every 20 tags
            if (createdTags % 20 === 0) {
              console.log(`    • Created ${createdTags}/${uniqueValues.length} tags...`);
            }
          } catch (err) {
            const errorMsg = (err as any).response?.data?.message || (err as any).message;
            if (errorMsg.includes('already exists')) {
              skippedTags++;
            } else {
              console.warn(`    ⚠️  Failed to create tag "${value}": ${errorMsg}`);
            }
          }
        }

        console.log(`  ✓ Created ${createdTags} tags for ${columnName}${skippedTags > 0 ? ` (${skippedTags} already existed)` : ''}\n`);
      } catch (err) {
        const errorMsg = (err as any).response?.data?.message || (err as any).message;
        if (!errorMsg.includes('already exists')) {
          console.error(`✗ Failed to create group "${columnName}":`, errorMsg);
        } else {
          console.log(`  ℹ️  Group already exists, continuing...\n`);
        }
      }
    }

    console.log('✅ Tag groups and tags created successfully!');
  }

  /**
   * Get tag ID by group name and tag value
   */
  private async getTagId(groupName: string, tagValue: string): Promise<string | null> {
    const cacheKey = `${groupName}:${tagValue}`;
    
    // Check cache first
    if (this.tagsCache.has(cacheKey)) {
      return this.tagsCache.get(cacheKey)!.id;
    }

    // Fetch from API
    try {
      const response = await this.api.get('/api/tags', {
        params: {
          name: tagValue,
          groupName: groupName,
        },
      });

      if (response.data && response.data.length > 0) {
        const tag = response.data[0];
        this.tagsCache.set(cacheKey, tag);
        return tag.id;
      }
    } catch (err) {
      // Tag might not exist
    }

    return null;
  }

  /**
   * Get music item from API by name
   */
  private async getMusicItemByName(searchName: string): Promise<ApiMusicItem | null> {
    try {
      // Cache API results on first call
      if (!this.apiMusicCache) {
        console.log('  📡 Fetching items from /api/items...');
        const response = await this.api.get('/api/items');
        this.apiMusicCache = Array.isArray(response.data) ? response.data : [];
        console.log(`  ✓ Cached ${this.apiMusicCache.length} items`);
        
        // Log first few items for debugging
        if (this.apiMusicCache.length > 0) {
          console.log(`  📝 Sample items:`);
          for (let i = 0; i < Math.min(3, this.apiMusicCache.length); i++) {
            const item = this.apiMusicCache[i];
            console.log(`     - ID: ${item.id}, Name: "${item.name}"`);
          }
        }
      }

      if (!this.apiMusicCache || this.apiMusicCache.length === 0) {
        return null;
      }

      // Find item where name matches (case-insensitive, trimmed)
      const normalizedSearchName = searchName.toLowerCase().trim();
      
      const found = this.apiMusicCache.find((item: any) => {
        if (!item.name) return false;
        const normalizedItemName = String(item.name).toLowerCase().trim();
        return normalizedItemName === normalizedSearchName;
      });
      
      return found || null;
    } catch (err) {
      console.error(`  ✗ Error fetching items from API:`, (err as any).message);
      return null;
    }
  }

  /**
   * STAGE 2: Tag each music item in API
   */
  async tagMusicItems(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎵 STAGE 2: Tagging Music Items');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const localMusic = await this.getLocalMusic();
    const columnNames = await this.getAllColumnNames();
    console.log(`📚 Processing ${localMusic.length} music items...`);
    console.log(`🏷️  Will tag with ${columnNames.length} columns\n`);

    // Pre-fetch API music cache
    console.log('📡 Fetching music items from API...');
    await this.getMusicItemByName('_dummy_'); // This populates the cache

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let tagCount = 0;
    let notFoundCount = 0;

    for (let idx = 0; idx < localMusic.length; idx++) {
      const track = localMusic[idx];
      const filename = this.getFilenameFromPath(track.dir);

      // Skip if no dir or couldn't extract filename
      if (!filename) {
        console.warn(`  ⚠️  [${idx + 1}] No valid dir path: "${track.title}"`);
        skippedCount++;
        continue;
      }

      // Show progress
      if ((idx + 1) % 100 === 0) {
        console.log(`  Progress: ${idx + 1}/${localMusic.length}`);
      }

      try {
        // Find music item in API by filename
        const apiItem = await this.getMusicItemByName(filename);

        if (!apiItem) {
          if (notFoundCount < 10) { // Only log first 10 not found
            console.warn(`  ⚠️  [${idx + 1}] Not found in API: "${filename}"`);
          }
          notFoundCount++;
          skippedCount++;
          continue;
        }

        // Tag with all column values
        for (const columnName of columnNames) {
          const columnValue = track[columnName];
          
          // Skip empty values
          if (!columnValue || (typeof columnValue === 'string' && !columnValue.trim())) {
            continue;
          }

          const tagId = await this.getTagId(columnName, String(columnValue));
          if (tagId) {
            try {
              // Use POST /api/item-tags to tag the item
              await this.api.post('/api/item-tags', {
                itemId: apiItem.id,
                tagId: tagId,
              });
              tagCount++;
            } catch (err) {
              // Tag might already exist, that's okay
            }
          }
        }

        successCount++;
      } catch (err) {
        console.error(
          `✗ [${idx + 1}] Error tagging "${track.title}":`,
          (err as any).message
        );
        failedCount++;
      }
    }

    console.log('\n✅ Tagging complete!');
    console.log(`  • Successfully tagged: ${successCount}`);
    console.log(`  • Tags applied: ${tagCount}`);
    console.log(`  • Not found in API: ${notFoundCount}`);
    console.log(`  • Failed: ${failedCount}`);
    console.log(`  • Skipped: ${skippedCount}`);
    console.log(`  • Total processed: ${localMusic.length}`);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Statistics');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const localMusic = await this.getLocalMusic();
    const columnNames = await this.getAllColumnNames();

    console.log(`📚 Local Database:
  • Total tracks: ${localMusic.length}
  • Tag groups to create: ${columnNames.length}\n`);

    // Show unique count for each column
    for (const columnName of columnNames) {
      const uniqueCount = (await this.getUniqueColumnValues(columnName)).length;
      console.log(`    ${columnName}: ${uniqueCount} unique values`);
    }

    try {
      const musicResponse = await this.api.get('/api/music');
      const apiMusicCount = (musicResponse.data || []).length;

      console.log(`\n🌐 API Server:
  • Music items: ${apiMusicCount}`);
    } catch (err) {
      console.log('\n🌐 API Server: (unable to fetch statistics)');
    }
  }

  /**
   * Full workflow
   */
  async run(): Promise<void> {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║ Music Upload & Tagging System          ║');
    console.log('║ Upload SQLite data to API with tags    ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Test connection
    const connected = await this.testConnection();
    if (!connected) {
      console.error('\n✗ Cannot proceed without API connection');
      this.close();
      return;
    }

    // Stage 1: Create tag groups and tags
    await this.createTagGroupsAndTags();

    // Stage 2: Tag music items
    await this.tagMusicItems();

    // Show statistics
    await this.getStats();

    console.log('\n✨ All done!\n');
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Main execution
async function main() {
  const tagger = new MusicUploadTagger('./musicData', 'http://192.168.4.41:4001');

  try {
    await tagger.run();
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    tagger.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MusicUploadTagger };
