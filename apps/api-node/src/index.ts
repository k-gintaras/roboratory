import express from 'express'
import { createPostgresDb } from '@roboratory/db-postgres'

const app = express()
const port = process.env.PORT || 3000

const db = createPostgresDb({ connectionString: process.env.DATABASE_URL })

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('/rows', async (_req, res) => {
  const q = await db.query('SELECT 1 as id')
  res.json(q)
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`api-node listening on ${port}`)
})
