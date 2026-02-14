import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { PostgresService } from '../services-reuse/postgres-service';

const database = 'tagging';
const csvPath = path.resolve(__dirname, '../assets/music-data.csv');

const tableName = 'music_files';

const schema = {
  title: 'TEXT',
  artist: 'TEXT',
  album: 'TEXT',
  originalGenre: 'TEXT',
  bpm: 'INTEGER',
  initialKey: 'TEXT',
  volume: 'TEXT',
  speed: 'TEXT',
  beats: 'TEXT',
  age: 'TEXT',
  vocals: 'TEXT',
  instruments: 'TEXT',
  funk: 'TEXT',
  attitude: 'TEXT',
  weight: 'TEXT',
  pitch: 'TEXT',
  melody: 'TEXT',
  energy: 'TEXT',
  voice: 'TEXT',
  sounds: 'TEXT',
  mood: 'TEXT',
  genre: 'TEXT',
  other: 'TEXT',
  dir: 'TEXT'
};

async function main() {
  const service = new PostgresService();
  // Create table if not exists
  await service.createTable(database, tableName, schema);

  const rows: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of rows) {
    // Convert bpm to integer or null
    if (typeof row.bpm === 'string') {
      const trimmed = row.bpm.trim();
      row.bpm = trimmed === '' ? null : Number(trimmed);
      if (isNaN(row.bpm)) row.bpm = null;
    }
    try {
      await service.insert(database, tableName, row);
    } catch (err) {
      console.error('Insert error:', err, 'Row:', row);
    }
  }

  await service.close();
  console.log(`✅ Imported ${rows.length} music files into ${tableName}`);
}

main().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
