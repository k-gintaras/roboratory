-- Check ID ranges for items, tags, tag_groups, tag_group_tags
SELECT MIN(id) AS min_id, MAX(id) AS max_id, COUNT(*) AS count FROM items;
SELECT MIN(id) AS min_id, MAX(id) AS max_id, COUNT(*) AS count FROM tags;
SELECT MIN(id) AS min_id, MAX(id) AS max_id, COUNT(*) AS count FROM tag_groups;
SELECT MIN(tag_group_id) AS min_group_id, MAX(tag_group_id) AS max_group_id, MIN(tag_id) AS min_tag_id, MAX(tag_id) AS max_tag_id, COUNT(*) AS count FROM tag_group_tags;
