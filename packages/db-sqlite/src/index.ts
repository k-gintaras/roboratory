import Database from 'better-sqlite3'
import { DbClient } from '@roboratory/db-core'

export function createSqliteDb(options: { filename?: string } = {}): DbClient {
  const filename = options.filename || ':memory:'
  const db = new Database(filename)

  return {
    async query(sql: string, params: any[] = []) {
      const stmt = db.prepare(sql)
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return { rows: stmt.all(...params) }
      }
      const info = stmt.run(...params)
      return { info }
    }
  }
}
