// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
import {
  boolean,
  decimal,
  foreignKey,
  integer,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

import { createdAt, createTable, id, nanoid, updatedAt } from "./utils"

export const cars = createTable("cars", {
  id,
  username: varchar("username", { length: 256 }).notNull().unique(),
  name: varchar("name", { length: 256 }),
  brand: varchar("brand", { length: 256 }),
  model: varchar("model", { length: 256 }),
  year: integer("year"),
  color: varchar("color", { length: 256 }),
  odometer: integer("odometer"),
  fuel: varchar("fuel", { length: 256 }),
  transmission: varchar("transmission", { length: 256 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  tankSize: decimal("tank_size", { precision: 10, scale: 2 }),
  hash: varchar("hash", { length: 256 }),
  createdAt,
  updatedAt,
})

export const carSessions = createTable(
  "car_sessions",
  {
    id,
    carId: nanoid("car_id").notNull(),
    sessionId: varchar("session_id", { length: 256 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: varchar("ip_address", { length: 256 }).notNull(),
    userAgent: text("user_agent").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_car_sessions_cars",
    }),
  ]
)

export const carImages = createTable(
  "car_images",
  {
    id,
    carId: nanoid("car_id").notNull(),
    imageUrl: varchar("image_url", { length: 512 }).notNull(),
    imageType: varchar("image_type", { length: 256 }).notNull(),
    imageTitle: varchar("image_title", { length: 256 }),
    imageDescription: text("image_description"),
    imageSize: integer("image_size"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_car_images_cars",
    }),
  ]
)

export const carFiles = createTable(
  "car_files",
  {
    id,
    carId: nanoid("car_id").notNull(),
    fileType: varchar("file_type", { length: 256 }).notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    fileDescription: text("file_description"),
    fileSize: integer("file_size"),
    fileUrl: varchar("file_url", { length: 512 }).notNull(),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_car_files_cars",
    }),
  ]
)

export const maintenanceLog = createTable(
  "maintenance_log",
  {
    id,
    carId: nanoid("car_id").notNull(),
    date: timestamp("date").notNull(),
    odometer: integer("odometer"),
    description: text("description"),
    system: varchar("system", { length: 256 }).notNull(),
    service: varchar("service", { length: 256 }).notNull(),
    cost: decimal("cost", { precision: 10, scale: 2 }),
    notes: text("notes"),
    parts: text("parts"),
    labor: text("labor"),
    total: decimal("total", { precision: 10, scale: 2 }),
    status: varchar("status", { length: 256 }),
    type: varchar("type", { length: 256 }),
    technician: varchar("technician", { length: 256 }),
    plannedFor: timestamp("planned_for"),
    completedAt: timestamp("completed_at"),
    createdAt,
    updatedAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_maintenance_log_cars",
    }),
  ]
)

export const maintenanceParts = createTable(
  "maintenance_parts",
  {
    id,
    maintenanceLogId: nanoid("maintenance_log_id").notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    partNumber: varchar("part_number", { length: 256 }),
    description: text("description"),
    price: integer("price"),
    quantity: integer("quantity").notNull(),
    total: integer("total"),
    url: varchar("url", { length: 512 }),
  },
  (table) => [
    foreignKey({
      columns: [table.maintenanceLogId],
      foreignColumns: [maintenanceLog.id],
      name: "fk_maintenance_parts_maintenance_log",
    }),
  ]
)

export const maintenanceFiles = createTable(
  "maintenance_files",
  {
    id,
    maintenanceLogId: nanoid("maintenance_log_id").notNull(),
    fileType: varchar("file_type", { length: 256 }).notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    fileSize: integer("file_size"),
    fileUrl: varchar("file_url", { length: 512 }).notNull(),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.maintenanceLogId],
      foreignColumns: [maintenanceLog.id],
      name: "fk_maintenance_files_maintenance_log",
    }),
  ]
)

export const gasLog = createTable(
  "gas_log",
  {
    id,
    carId: nanoid("car_id").notNull(),
    date: timestamp("date").notNull(),
    trip: integer("trip"),
    odometer: integer("odometer"),
    gallons: decimal("gallons", { precision: 10, scale: 2 }),
    pricePerGallon: decimal("price_per_gallon", { precision: 10, scale: 2 }),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }),
    notes: text("notes"),
    fuelType: varchar("fuel_type", { length: 256 }),
    gpsLatitude: decimal("gps_latitude", { precision: 10, scale: 6 }),
    gpsLongitude: decimal("gps_longitude", { precision: 10, scale: 6 }),
    mpg: decimal("mpg", { precision: 10, scale: 2 }),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_gas_log_cars",
    }),
  ]
)

export const wishlist = createTable(
  "wishlist",
  {
    id,
    carId: nanoid("car_id").notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    url: varchar("url", { length: 512 }),
    imageUrl: varchar("image_url", { length: 512 }),
    system: varchar("system", { length: 256 }).notNull(),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_wishlist_cars",
    }),
  ]
)
