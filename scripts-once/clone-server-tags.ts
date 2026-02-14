
import { MusicTaggingServerService } from "../services-reuse/music-tagging-server";
import { PostgresService } from "../services-reuse/postgres-service";

const database = 'tagging';

async function main() {
  const service = new PostgresService();
  const api = new MusicTaggingServerService();

  // 1. Fetch all entities from server
  const [
    tagGroupsRes,
    tagsRes,
    tagGroupTagsRes,
    topicsRes,
    topicTagGroupsRes,
    itemsRes,
    itemTagsRes,
    topicItemsRes
  ] = await Promise.all([
    api.getTagGroups(),
    api.getTags(),
    api.getTagGroupTags(),
    api.getTopics(),
    api.getTopicTagGroups(),
    api.getItems(),
    api.getItemTags(),
    api.getTopicItems()
  ]);
  const tagGroups = tagGroupsRes.data;
  const tags = tagsRes.data;
  const tagGroupTags = tagGroupTagsRes.data;
  const topics = topicsRes.data;
  const topicTagGroups = topicTagGroupsRes.data;
  const items = itemsRes.data;
  const itemTags = itemTagsRes.data;
  const topicItems = topicItemsRes.data;

  // Log counts for diagnosis
  console.log('Server counts:');
  console.log('tagGroups:', Array.isArray(tagGroups) ? tagGroups.length : 'N/A');
  console.log('tags:', Array.isArray(tags) ? tags.length : 'N/A');
  console.log('tagGroupTags:', Array.isArray(tagGroupTags) ? tagGroupTags.length : 'N/A');
  console.log('topics:', Array.isArray(topics) ? topics.length : 'N/A');
  console.log('topicTagGroups:', Array.isArray(topicTagGroups) ? topicTagGroups.length : 'N/A');
  console.log('items:', Array.isArray(items) ? items.length : 'N/A');
  console.log('itemTags:', Array.isArray(itemTags) ? itemTags.length : 'N/A');
  console.log('topicItems:', Array.isArray(topicItems) ? topicItems.length : 'N/A');

  // 2. Clear local tables (in dependency order)
  await service.query(database, 'DELETE FROM topic_items');
  await service.query(database, 'DELETE FROM item_tags');
  await service.query(database, 'DELETE FROM items');
  await service.query(database, 'DELETE FROM topic_tag_groups');
  await service.query(database, 'DELETE FROM topics');
  await service.query(database, 'DELETE FROM tag_group_tags');
  await service.query(database, 'DELETE FROM tags');
  await service.query(database, 'DELETE FROM tag_groups');

  // 3. Insert tag_groups
  let i = 0;
  for (const group of tagGroups) {
    await service.query(
      database,
      'INSERT INTO tag_groups (id, name) VALUES ($1, $2)',
      [group.id, group.name]
    );
    if (++i % 10 === 0 || i === tagGroups.length) {
      console.log(`Inserted tag group ${i}/${tagGroups.length}`);
    }
  }

  // 4. Insert tags
  i = 0;
  for (const tag of tags) {
    await service.query(
      database,
      'INSERT INTO tags (id, name) VALUES ($1, $2)',
      [tag.id, tag.name]
    );
    if (++i % 100 === 0 || i === tags.length) {
      console.log(`Inserted tag ${i}/${tags.length}`);
    }
  }

  // 5. Insert tag_group_tags
  i = 0;
  for (const rel of tagGroupTags) {
    await service.query(
      database,
      'INSERT INTO tag_group_tags (tag_group_id, tag_id) VALUES ($1, $2)',
      [rel.tag_group_id, rel.tag_id]
    );
    if (++i % 100 === 0 || i === tagGroupTags.length) {
      console.log(`Inserted tag_group_tag ${i}/${tagGroupTags.length}`);
    }
  }

  // 6. Insert topics
  i = 0;
  for (const topic of topics) {
    await service.query(
      database,
      'INSERT INTO topics (id, name, description) VALUES ($1, $2, $3)',
      [topic.id, topic.name, topic.description || null]
    );
    if (++i % 10 === 0 || i === topics.length) {
      console.log(`Inserted topic ${i}/${topics.length}`);
    }
  }

  // 7. Insert topic_tag_groups
  i = 0;
  for (const rel of topicTagGroups) {
    await service.query(
      database,
      'INSERT INTO topic_tag_groups (topic_id, tag_group_id) VALUES ($1, $2)',
      [rel.topic_id, rel.tag_group_id]
    );
    if (++i % 100 === 0 || i === topicTagGroups.length) {
      console.log(`Inserted topic_tag_group ${i}/${topicTagGroups.length}`);
    }
  }

  // 8. Insert items
  i = 0;
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

  // 9. Insert item_tags
  i = 0;
  for (const rel of itemTags) {
    await service.query(
      database,
      'INSERT INTO item_tags (item_id, tag_id) VALUES ($1, $2)',
      [rel.item_id, rel.tag_id]
    );
    if (++i % 100 === 0 || i === itemTags.length) {
      console.log(`Inserted item_tag ${i}/${itemTags.length}`);
    }
  }

  // 10. Insert topic_items
  i = 0;
  for (const rel of topicItems) {
    await service.query(
      database,
      'INSERT INTO topic_items (topic_id, item_id) VALUES ($1, $2)',
      [rel.topic_id, rel.item_id]
    );
    if (++i % 100 === 0 || i === topicItems.length) {
      console.log(`Inserted topic_item ${i}/${topicItems.length}`);
    }
  }

  await service.close();
  console.log('✅ Cloned all tag/topic/item data from server to local database');
}

main().catch(err => {
  console.error('❌ Clone failed:', err);
  process.exit(1);
});
