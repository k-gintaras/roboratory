import { Pool, Client } from 'pg';
import { config } from 'dotenv';

config();

/**
 * PostgreSQL Service - Admin operations for database management
 * Uses root/admin credentials from environment variables
 */
export class PostgresService {
  private pool: Pool;
  private adminClient: Client | null = null;
  private closed = false;

  constructor(options?: { host?: string; port?: number; username?: string; password?: string }) {
    const host = options?.host || process.env.POSTGRES_HOST || 'localhost';
    const port = options?.port || parseInt(process.env.POSTGRES_PORT || '5432', 10);
    const user = options?.username || process.env.POSTGRES_USER || 'postgres';
    const password = options?.password || process.env.POSTGRES_PASSWORD || '';

    // Create pool for regular connections (to specific database)
    this.pool = new Pool({
      host,
      port,
      user,
      password,
    });
  }

  /**
   * Connect to postgres database (not a specific DB) for admin operations
   */
  private async getAdminClient(): Promise<Client> {
    if (this.closed) throw new Error('Service is closed');
    if (this.adminClient) {
      return this.adminClient;
    }

    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || '';

    this.adminClient = new Client({
      host,
      port,
      user,
      password,
      database: 'postgres', // Connect to default postgres DB for admin operations
    });

    try {
      await this.adminClient.connect();
    } catch (err) {
      this.adminClient = null;
      throw new Error('Failed to connect to admin client: ' + err);
    }
    return this.adminClient;
  }

  /**
   * List all databases on the server
   */
  async listDatabases(): Promise<string[]> {
    if (this.closed) throw new Error('Service is closed');
    const client = await this.getAdminClient();
    try {
      const result = await client.query(`
        SELECT datname FROM pg_database 
        WHERE datistemplate = false 
        ORDER BY datname;
      `);
      return result.rows.map((row: any) => row.datname);
    } catch (error) {
      throw new Error(`Failed to list databases: ${error}`);
    }
  }

  /**
   * Check if a specific database exists
   */
  async databaseExists(dbName: string): Promise<boolean> {
    if (this.closed) throw new Error('Service is closed');
    const databases = await this.listDatabases();
    return databases.includes(dbName);
  }

  /**
   * Create a new database
   */
  async createDatabase(dbName: string): Promise<void> {
    const client = await this.getAdminClient();
    try {
      // Check if database already exists
      const exists = await this.databaseExists(dbName);
      if (exists) {
        throw new Error(`Database "${dbName}" already exists`);
      }

      await client.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } catch (error) {
      throw new Error(`Failed to create database "${dbName}": ${error}`);
    }
  }

  /**
   * Drop a database
   */
  async dropDatabase(dbName: string): Promise<void> {
    const client = await this.getAdminClient();
    try {
      const exists = await this.databaseExists(dbName);
      if (!exists) {
        throw new Error(`Database "${dbName}" does not exist`);
      }

      // Terminate all connections to the database first
      await client.query(`
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = $1
        AND pid <> pg_backend_pid();
      `, [dbName]);

      await client.query(`DROP DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" dropped successfully`);
    } catch (error) {
      throw new Error(`Failed to drop database "${dbName}": ${error}`);
    }
  }

  /**
   * Query a specific database
   */
  async query(database: string, queryText: string, params?: any[]): Promise<any> {
    if (this.closed) throw new Error('Service is closed');
    const client = new Client({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database,
    });

    try {
      await client.connect();
      const result = await client.query(queryText, params || []);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to query database "${database}": ${error}`);
    } finally {
      await client.end();
    }
  }

  /**
   * Create a table in a specific database
   */
  async createTable(
    database: string,
    tableName: string,
    schema: Record<string, string>
  ): Promise<void> {
    const columns = Object.entries(schema)
      .map(([name, type]) => `"${name}" ${type}`)
      .join(', ');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        ${columns}
      );
    `;

    try {
      await this.query(database, createTableQuery);
      console.log(`✅ Table "${tableName}" created in database "${database}"`);
    } catch (error) {
      throw new Error(`Failed to create table: ${error}`);
    }
  }

  /**
   * Insert data into a table
   */
  async insert(database: string, tableName: string, data: Record<string, any>): Promise<void> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const insertQuery = `
      INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
      VALUES (${placeholders});
    `;

    try {
      await this.query(database, insertQuery, values);
      console.log(`✅ Data inserted into "${tableName}"`);
    } catch (error) {
      throw new Error(`Failed to insert data: ${error}`);
    }
  }

  /**
   * Get all rows from a table
   */
  async select(database: string, tableName: string): Promise<any[]> {
    const selectQuery = `SELECT * FROM "${tableName}";`;
    try {
      return await this.query(database, selectQuery);
    } catch (error) {
      throw new Error(`Failed to select from table: ${error}`);
    }
  }

  /**
   * Update rows in a table
   */
  async update(
    database: string,
    tableName: string,
    data: Record<string, any>,
    whereClause: string
  ): Promise<void> {
    const setClause = Object.keys(data)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(', ');

    const values = Object.values(data);

    const updateQuery = `
      UPDATE "${tableName}"
      SET ${setClause}
      WHERE ${whereClause};
    `;

    try {
      await this.query(database, updateQuery, values);
      console.log(`✅ Data updated in "${tableName}"`);
    } catch (error) {
      throw new Error(`Failed to update data: ${error}`);
    }
  }

  /**
   * Delete rows from a table
   */
  async delete(database: string, tableName: string, whereClause: string): Promise<void> {
    const deleteQuery = `
      DELETE FROM "${tableName}"
      WHERE ${whereClause};
    `;

    try {
      await this.query(database, deleteQuery);
      console.log(`✅ Data deleted from "${tableName}"`);
    } catch (error) {
      throw new Error(`Failed to delete data: ${error}`);
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    this.closed = true;
    if (this.adminClient) {
      await this.adminClient.end();
      this.adminClient = null;
    }
    await this.pool.end();
  }
}
