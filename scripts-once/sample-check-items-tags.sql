-- SQL to check random sample of items, tags, tag_groups, tag_group_tags
-- (for manual use in psql if needed)

-- Sample 10 random items
SELECT * FROM items ORDER BY random() LIMIT 10;
-- Sample 10 random tags
SELECT * FROM tags ORDER BY random() LIMIT 10;
-- Sample 10 random tag_groups
SELECT * FROM tag_groups ORDER BY random() LIMIT 10;
-- Sample 10 random tag_group_tags
SELECT * FROM tag_group_tags ORDER BY random() LIMIT 10;
