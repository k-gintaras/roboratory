import { MusicTaggingServerService } from "../services-reuse/music-tagging-server";
import { PostgresService } from "../services-reuse/postgres-service";

const database = 'tagging';
const SAMPLE_SIZE = 10;

function getRandomSample(arr: any[], n: number) {
  const result = [];
  const used = new Set();
  while (result.length < n && result.length < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      result.push(arr[idx]);
      used.add(idx);
    }
  }
  return result;
}

async function main() {
  const service = new PostgresService();
  const api = new MusicTaggingServerService();

  // Fetch all from server
  const [itemsRes, tagsRes, tagGroupsRes, tagGroupTagsRes] = await Promise.all([
    api.getItems(),
    api.getTags(),
    api.getTagGroups(),
    api.getTagGroupTags()
  ]);
  const items = itemsRes.data;
  const tags = tagsRes.data;
  const tagGroups = tagGroupsRes.data;
  const tagGroupTags = tagGroupTagsRes.data;

  // Pick random samples
  const sampleItems = getRandomSample(items, SAMPLE_SIZE);
  const sampleTags = getRandomSample(tags, SAMPLE_SIZE);
  const sampleTagGroups = getRandomSample(tagGroups, SAMPLE_SIZE);
  const sampleTagGroupTags = getRandomSample(tagGroupTags, SAMPLE_SIZE);

  // Query local DB for same IDs
  const checks = [
    ["item", sampleItems, "items", "id"],
    ["tag", sampleTags, "tags", "id"],
    ["tag_group", sampleTagGroups, "tag_groups", "id"],
    ["tag_group_tag", sampleTagGroupTags, "tag_group_tags", ["tag_group_id", "tag_id"]]
  ];
  for (const [name, sample, table, idField] of checks) {
    if (!Array.isArray(sample) || sample.length === 0) {
      console.log(`[${name}] No sample data to check.`);
      continue;
    }
    if (name === "tag_group_tag") {
      for (const rel of sample) {
        if (!rel || rel.tag_group_id === undefined || rel.tag_id === undefined) {
          console.log(`[tag_group_tag] Invalid sample:`, rel);
          continue;
        }
        const res = await service.query(
          database,
          'SELECT * FROM tag_group_tags WHERE tag_group_id = $1 AND tag_id = $2',
          [rel.tag_group_id, rel.tag_id]
        );
        const found = res && res.rows && res.rows.length > 0;
        console.log(`[tag_group_tag] server: (${rel.tag_group_id},${rel.tag_id}) local:`, found ? "FOUND" : "MISSING");
      }
    } else {
      for (const obj of sample) {
        if (!obj || obj.id === undefined) {
          console.log(`[${name}] Invalid sample:`, obj);
          continue;
        }
        const res = await service.query(
          database,
          `SELECT * FROM ${table} WHERE id = $1`,
          [obj.id]
        );
        const found = res && res.rows && res.rows.length > 0;
        console.log(`[${name}] server: ${obj.id} local:`, found ? "FOUND" : "MISSING");
      }
    }
  }

  await service.close();
}

main().catch(err => {
  console.error('❌ Sample check failed:', err);
  process.exit(1);
});
