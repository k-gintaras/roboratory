import { PostgresService } from "../services-reuse/postgres-service";

/**
 * Setup tagging database schema
 * @param service PostgresService instance
 * @param database Database name
 */
export async function setupTaggingDatabase(service: PostgresService, database: string) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      path TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      parent_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
      size BIGINT,
      last_modified TIMESTAMPTZ NOT NULL,
      subtype TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      "group" TEXT NOT NULL,
      name TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS tag_groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS tag_group_tags (
      tag_group_id INTEGER NOT NULL REFERENCES tag_groups(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (tag_group_id, tag_id)
    );`,
    `CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS topic_tag_groups (
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      tag_group_id INTEGER NOT NULL REFERENCES tag_groups(id) ON DELETE CASCADE,
      PRIMARY KEY (topic_id, tag_group_id)
    );`,
    `CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      link TEXT,
      image_url TEXT,
      type TEXT NOT NULL DEFAULT 'file'
    );`,
    `CREATE TABLE IF NOT EXISTS item_tags (
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (item_id, tag_id)
    );`,
    `CREATE TABLE IF NOT EXISTS topic_items (
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      PRIMARY KEY (topic_id, item_id)
    );`
  ];

  for (const q of queries) {
    await service.query(database, q);
  }
}
