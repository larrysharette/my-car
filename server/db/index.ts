import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres"
import { relations } from "./relations"

const db = drizzle({ relations })

export default db
