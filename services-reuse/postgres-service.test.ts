import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PostgresService } from './postgres-service';

/**
 * Jest tests for PostgresService
 * These tests require a running PostgreSQL server with credentials in .env
 */
describe('PostgresService', () => {
  let service: PostgresService;
  const testDatabaseName = 'test_roboratory_' + Date.now();
  const testTableName = 'test_users';

  beforeAll(async () => {
    service = new PostgresService();
  });

  afterAll(async () => {
    // Clean up: drop test database if it exists
    try {
      const exists = await service.databaseExists(testDatabaseName);
      if (exists) {
        await service.dropDatabase(testDatabaseName);
      }
    } catch (error) {
      console.log('Cleanup error (may be expected):', error);
    }
    await service.close();
  });

  describe('Database Operations', () => {
    it('should list existing databases', async () => {
      const databases = await service.listDatabases();
      expect(Array.isArray(databases)).toBe(true);
      expect(databases.length).toBeGreaterThan(0);
      // postgres system database should always exist
      expect(databases).toContain('postgres');
    });

    it('should check if postgres database exists', async () => {
      const exists = await service.databaseExists('postgres');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent database', async () => {
      const exists = await service.databaseExists('definitely_not_a_real_database_xyz123');
      expect(exists).toBe(false);
    });

    it('should create a new database', async () => {
      const created = await service.createDatabase(testDatabaseName);
      expect(created).toBeUndefined(); // Function doesn't return anything on success

      // Verify it was created
      const exists = await service.databaseExists(testDatabaseName);
      expect(exists).toBe(true);
    });

    it('should throw error when creating a database that already exists', async () => {
      // Database was created in previous test
      await expect(service.createDatabase(testDatabaseName)).rejects.toThrow(
        'already exists'
      );
    });
  });

  describe('Table Operations', () => {
    it('should create a table in the test database', async () => {
      const schema = {
        id: 'SERIAL PRIMARY KEY',
        name: 'VARCHAR(255) NOT NULL',
        email: 'VARCHAR(255) UNIQUE NOT NULL',
        created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      };

      await service.createTable(testDatabaseName, testTableName, schema);

      // Verify table was created by querying it
      const result = await service.query(
        testDatabaseName,
        `SELECT * FROM "${testTableName}";`
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Data Operations', () => {
    beforeAll(async () => {
      // Ensure table exists for data operations
      const schema = {
        id: 'SERIAL PRIMARY KEY',
        name: 'VARCHAR(255) NOT NULL',
        email: 'VARCHAR(255) UNIQUE NOT NULL',
        created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
      };
      await service.createTable(testDatabaseName, testTableName, schema);
    });

    it('should insert data into a table', async () => {
      await service.insert(testDatabaseName, testTableName, {
        name: 'John Doe',
        email: 'john@example.com',
      });

      // Verify insertion
      const result = await service.select(testDatabaseName, testTableName);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('John Doe');
      expect(result[0].email).toBe('john@example.com');
    });

    it('should select all data from a table', async () => {
      // Insert another record
      await service.insert(testDatabaseName, testTableName, {
        name: 'Jane Smith',
        email: 'jane@example.com',
      });

      const result = await service.select(testDatabaseName, testTableName);
      expect(result.length).toBe(2);
      expect(result.map((r: any) => r.name)).toContain('John Doe');
      expect(result.map((r: any) => r.name)).toContain('Jane Smith');
    });

    it('should update data in a table', async () => {
      await service.update(
        testDatabaseName,
        testTableName,
        { name: 'John Updated' },
        'email = \'john@example.com\''
      );

      const result = await service.select(testDatabaseName, testTableName);
      const updated = result.find((r: any) => r.email === 'john@example.com');
      expect(updated.name).toBe('John Updated');
    });

    it('should delete data from a table', async () => {
      await service.delete(
        testDatabaseName,
        testTableName,
        'email = \'jane@example.com\''
      );

      const result = await service.select(testDatabaseName, testTableName);
      expect(result.length).toBe(1);
      expect(result[0].email).toBe('john@example.com');
    });
  });

  describe('Database Cleanup', () => {
    it('should drop a database', async () => {
      // Create a temporary database
      const tempDb = 'temp_db_' + Date.now();
      await service.createDatabase(tempDb);

      // Verify it exists
      let exists = await service.databaseExists(tempDb);
      expect(exists).toBe(true);

      // Drop it
      await service.dropDatabase(tempDb);

      // Verify it's gone
      exists = await service.databaseExists(tempDb);
      expect(exists).toBe(false);
    });

    it('should throw error when dropping a non-existent database', async () => {
      await expect(service.dropDatabase('definitely_not_a_real_database_xyz456')).rejects.toThrow(
        'does not exist'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const badService = new PostgresService({
        host: 'invalid-host',
        port: 9999,
        username: 'postgres',
        password: 'wrong',
      });

      await expect(badService.listDatabases()).rejects.toThrow();
      await badService.close();
    });

    it('should throw error for invalid query', async () => {
      await expect(
        service.query(testDatabaseName, 'INVALID SQL QUERY HERE')
      ).rejects.toThrow();
    });
  });

  describe('Connection Management', () => {
    it('should close all connections properly', async () => {
      const tempService = new PostgresService();

      // Use the service
      const databases = await tempService.listDatabases();
      expect(databases.length).toBeGreaterThan(0);

      // Close it
      await tempService.close();

      // Attempting to use after close should fail
      await expect(tempService.listDatabases()).rejects.toThrow();
    });
  });
});
