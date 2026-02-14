import { PostgresService } from '../services-reuse/postgres-service';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

const csvPath = path.resolve(__dirname, '../assets/music-data.csv');
const database = 'tagging';

// Columns to skip as tag groups
const skipColumns = new Set(['title', 'artist', 'album', 'dir', 'link', 'image_url']);

export async function importTagGroupsAndTags(service: PostgresService) {
  // Read CSV and collect unique values for each column
  const uniqueValues: Record<string, Set<string>> = {};
  let columns: string[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('headers', (headers) => {
        columns = headers;
        for (const col of headers) {
          if (!skipColumns.has(col)) uniqueValues[col] = new Set();
        }
      })
      .on('data', (row) => {
        for (const col of columns) {
          if (!skipColumns.has(col) && row[col] && row[col].trim() !== '') {
            uniqueValues[col].add(row[col].trim());
          }
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Create tag groups and tags
  for (const groupName of Object.keys(uniqueValues)) {
    // Create tag group
    await service.insert(database, 'tag_groups', { name: groupName });
    // Get tag group id
    const [{ id: tagGroupId }] = await service.query(database, 'SELECT id FROM tag_groups WHERE name = $1', [groupName]);
    // Create tags for each unique value
    for (const tagName of uniqueValues[groupName]) {
      await service.insert(database, 'tags', { group: groupName, name: tagName });
      // Optionally, link tag to tag_group_tags
      const [{ id: tagId }] = await service.query(database, 'SELECT id FROM tags WHERE "group" = $1 AND name = $2', [groupName, tagName]);
      await service.insert(database, 'tag_group_tags', { tag_group_id: tagGroupId, tag_id: tagId });
    }
    console.log(`✅ Created tag group '${groupName}' with ${uniqueValues[groupName].size} tags`);
  }
}

// Example usage (uncomment to run directly)
// (async () => {
//   const service = new PostgresService();
//   await importTagGroupsAndTags(service);
//   await service.close();
// })();
