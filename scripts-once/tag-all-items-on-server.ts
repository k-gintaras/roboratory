import { MusicTaggingServerService } from '../services-reuse/music-tagging-server';
import { PostgresService } from '../services-reuse/postgres-service';

const database = 'tagging';

async function main() {
  const service = new PostgresService();
  const api = new MusicTaggingServerService();

  // Fetch all item_tags from local DB
  const itemTags: any[] = await service.query(database, 'SELECT item_id, tag_id FROM item_tags');

  // For each item_tag, associate on server
  let taggedCount = 0;
  for (const rel of itemTags) {
    try {
      await api.createItemTag({ itemId: rel.item_id, tagId: rel.tag_id });
      taggedCount++;
      if (taggedCount % 100 === 0 || taggedCount === itemTags.length) {
        console.log(`Tagged ${taggedCount}/${itemTags.length} item-tag associations on server...`);
      }
    } catch (err) {
      console.error(`Failed to tag item ${rel.item_id} with tag ${rel.tag_id}:`, err);
    }
  }

  await service.close();
  console.log(`✅ Tagged all items on server. Total associations: ${taggedCount}`);
}

main().catch(err => {
  console.error('❌ Server tagging failed:', err);
  process.exit(1);
});
