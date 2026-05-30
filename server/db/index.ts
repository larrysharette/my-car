import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { relations } from "./relations"
import * as schema from "./schema"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle({
  client: pool,
  schema,
  relations,
})

export default db
