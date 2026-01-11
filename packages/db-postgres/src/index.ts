import { Pool } from 'pg'
import { DbClient } from '@roboratory/db-core'

export function createPostgresDb(options: { connectionString?: string } = {}): DbClient {
  const pool = new Pool({ connectionString: options.connectionString })

  return {
    async query(text: string, params: any[] = []) {
      const client = await pool.connect()
      try {
        const res = await client.query(text, params)
        return { rows: res.rows }
      } finally {
        client.release()
      }
    }
  }
}
