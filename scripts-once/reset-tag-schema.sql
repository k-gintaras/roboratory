-- Drop tables in reverse dependency order to avoid foreign key issues
DROP TABLE IF EXISTS topic_items CASCADE;
DROP TABLE IF EXISTS item_tags CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS topic_tag_groups CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS tag_group_tags CASCADE;
DROP TABLE IF EXISTS tag_groups CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
-- music_files is kept as backup, not dropped

-- Recreate tables exactly as on server
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tag_group_tags (
  tag_group_id INTEGER NOT NULL REFERENCES tag_groups(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (tag_group_id, tag_id)
);

CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS topic_tag_groups (
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  tag_group_id INTEGER NOT NULL REFERENCES tag_groups(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, tag_group_id)
);

CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT,
  image_url TEXT,
  type TEXT NOT NULL DEFAULT 'file'
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS topic_items (
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  PRIMARY KEY (topic_id, item_id)
);
