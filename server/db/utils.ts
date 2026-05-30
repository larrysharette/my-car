// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
import { sql } from "drizzle-orm";
import { pgTableCreator, timestamp, varchar } from "drizzle-orm/pg-core";
import { nanoid as nid } from "nanoid";

export const id = varchar("id", { length: 64 })
  .notNull()
  .primaryKey()
  .$defaultFn(() => nid());

export const nanoid = (name: string) => varchar(name, { length: 64 });

export const createdAt = timestamp("created_at")
  .default(sql`CURRENT_TIMESTAMP`)
  .notNull();
export const updatedAt = timestamp("updated_at").$onUpdateFn(() => new Date());

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `cars_${name}`);