-- Verify tags for the first 10 items from music-data.csv
SELECT i.id AS item_id, i.name AS item_name, tg.name AS tag_group, t.name AS tag_name
FROM items i
JOIN item_tags it ON i.id = it.item_id
JOIN tags t ON it.tag_id = t.id
JOIN tag_group_tags tgt ON t.id = tgt.tag_id
JOIN tag_groups tg ON tgt.tag_group_id = tg.id
WHERE i.id BETWEEN 1074 AND 1083
ORDER BY i.id, tg.id;
