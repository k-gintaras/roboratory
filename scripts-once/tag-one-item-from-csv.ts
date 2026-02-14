import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { PostgresService } from '../services-reuse/postgres-service';

const database = 'tagging';
const csvPath = path.resolve(__dirname, '../assets/music-data.csv');

async function main() {
  const service = new PostgresService();

  // Read one row from CSV
  const row = await new Promise<any>((resolve, reject) => {
    let found = false;
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => {
        if (!found) {
          found = true;
          resolve(data);
        }
      })
      .on('end', () => {
        if (!found) reject(new Error('No data in CSV'));
      })
      .on('error', reject);
  });

  // Parse name from dir
  const dir = row.dir;
  let name = path.basename(dir, path.extname(dir));
  name = name.trim();
  console.log('Parsed name from dir:', name);

  // Debug: print char codes of parsed name
  console.log('Parsed name char codes:', Array.from(name).map(c => (c as string).charCodeAt(0)));

  // Fetch all items and print char codes for comparison
  const allItemsRes = await service.query(database, 'SELECT id, name FROM items');
  console.log('allItemsRes:', allItemsRes);
  if (Array.isArray(allItemsRes)) {
    for (const rowItem of allItemsRes) {
      const dbName = (rowItem.name || '').trim();
      const codes = Array.from(dbName).map(c => (c as string).charCodeAt(0));
      if (dbName.length === name.length) {
        console.log(`DB item id=${rowItem.id} name='${dbName}' char codes:`, codes);
      }
    }
  } else {
    console.log('allItemsRes is not an array:', allItemsRes);
  }

  // Find item in items table (case-insensitive, trimmed)
  const itemRes = await service.query(
    database,
    'SELECT * FROM items WHERE TRIM(name) ILIKE $1',
    [name]
  );
  if (!itemRes.rows || itemRes.rows.length === 0) {
    console.log('Item not found for name:', name);
    await service.close();
    return;
  }
  const item = itemRes.rows[0];
  console.log('Found item:', item);

  // For each tag group, find tag id for the value in the row
  // Example: tag_group 'bpm', value row.bpm
  // We'll do this for the first 3 tag groups as a demo
  const tagGroups = await service.query(database, 'SELECT * FROM tag_groups ORDER BY id ASC LIMIT 3');
  for (const group of tagGroups.rows) {
    const groupName = group.name;
    const tagValue = row[groupName];
    if (!tagValue) {
      console.log(`No value for tag group ${groupName}`);
      continue;
    }
    // Find tag id
    const tagRes = await service.query(database, 'SELECT * FROM tags WHERE name = $1', [tagValue]);
    if (!tagRes.rows || tagRes.rows.length === 0) {
      console.log(`No tag found for value '${tagValue}' in group '${groupName}'`);
      continue;
    }
    const tag = tagRes.rows[0];
    console.log(`For group '${groupName}', value '${tagValue}' => tag id ${tag.id}`);
    // (Optional) Tag the item: insert into item_tags
    // await service.query(database, 'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [item.id, tag.id]);
  }

  await service.close();
}

main().catch(err => {
  console.error('❌ Tagging failed:', err);
  process.exit(1);
});
