export type QueryResult = { rows?: any[]; info?: any }

export interface DbClient {
  query(queryText: string, params?: any[]): Promise<QueryResult>
}

export type DbConfig = {
  connectionString?: string
}

export class DbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DbError'
  }
}

export function createDb(_cfg?: DbConfig): DbClient {
  // A tiny in-memory stub for experiments. Real drivers live in adapter packages.
  return {
    async query(_queryText: string) {
      return { rows: [] }
    }
  }
}
