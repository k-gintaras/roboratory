import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { PostgresService } from '../services-reuse/postgres-service';

const database = 'tagging';
const csvPath = path.resolve(__dirname, '../assets/music-data.csv');

async function main() {
  const service = new PostgresService();

  // Read first 3 rows from CSV
  const rows: any[] = [];
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (rows.length < 3) rows.push(data);
        if (rows.length === 3) resolve();
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Fetch all items and tags once for fast in-memory matching
  const items: any[] = await service.query(database, 'SELECT id, name FROM items');
  const tagGroups: any[] = await service.query(database, 'SELECT id, name FROM tag_groups');
  const tags: any[] = await service.query(database, 'SELECT id, name FROM tags');

  for (const row of rows) {
    const dir = row.dir;
    let name = path.basename(dir, path.extname(dir)).trim();
    // Find item in-memory
    const item = items.find(i => (i.name || '').trim() === name);
    if (!item) {
      console.log('Item not found for name:', name);
      continue;
    }
    console.log('Found item:', item);

    // For each tag group, find tag id for the value in the row
    for (const group of tagGroups) {
      const groupName = group.name;
      const tagValue = row[groupName];
      if (!tagValue) continue;
      // Find tag in-memory
      const tag = tags.find(t => (t.name || '').trim() === String(tagValue).trim());
      if (!tag) continue;
      // Insert into item_tags (ignore duplicates)
      await service.query(
        database,
        'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [item.id, tag.id]
      );
      console.log(`Tagged item ${item.id} (${name}) with tag ${tag.id} (${tag.name}) for group ${groupName}`);
    }
  }

  await service.close();
}

main().catch(err => {
  console.error('❌ Tagging failed:', err);
  process.exit(1);
});
