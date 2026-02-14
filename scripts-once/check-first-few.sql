-- Check first few items, tags, tag_groups, tag_group_tags by ID order
SELECT * FROM items ORDER BY id ASC LIMIT 10;
SELECT * FROM tags ORDER BY id ASC LIMIT 10;
SELECT * FROM tag_groups ORDER BY id ASC LIMIT 10;
SELECT * FROM tag_group_tags ORDER BY tag_group_id ASC, tag_id ASC LIMIT 10;
