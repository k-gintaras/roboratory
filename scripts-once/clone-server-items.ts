import { MusicTaggingServerService } from "../services-reuse/music-tagging-server";
import { PostgresService } from "../services-reuse/postgres-service";

const database = 'tagging';

async function main() {
  const service = new PostgresService();
  const api = new MusicTaggingServerService();

  // Fetch all items from server
  const itemsRes = await api.getItems();
  const items = itemsRes.data;

  // Clear local items table only
  await service.query(database, 'DELETE FROM items');

  // Insert items with original IDs
  let i = 0;
  for (const item of items) {
    await service.query(
      database,
      'INSERT INTO items (id, name, link, image_url, type) VALUES ($1, $2, $3, $4, $5)',
      [item.id, item.name, item.link || null, item.image_url || null, item.type || 'file']
    );
    if (++i % 100 === 0 || i === items.length) {
      console.log(`Inserted item ${i}/${items.length}`);
    }
  }

  await service.close();
  console.log('✅ Cloned items from server to local database');
}

main().catch(err => {
  console.error('❌ Clone failed:', err);
  process.exit(1);
});
