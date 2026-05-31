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
  trim: varchar("trim", { length: 256 }),
  bodyClass: varchar("body_class", { length: 256 }),
  driveType: varchar("drive_type", { length: 256 }),
  engineDisplacement: varchar("engine_displacement", { length: 256 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  tankSize: decimal("tank_size", { precision: 10, scale: 2 }),
  hash: varchar("hash", { length: 256 }),
  serviceManualId: nanoid("service_manual_id"),
  createdAt,
  updatedAt,
})

export const serviceManuals = createTable(
  "service_manuals",
  {
    id,
    make: varchar("make", { length: 256 }).notNull(),
    model: varchar("model", { length: 256 }).notNull(),
    startYear: integer("start_year").notNull(),
    endYear: integer("end_year").notNull(),
    fileUrl: varchar("file_url", { length: 512 }).notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    fileSize: integer("file_size"),
    purchaseUrl: varchar("purchase_url", { length: 512 }).notNull(),
    uploadedByCarId: nanoid("uploaded_by_car_id").notNull(),
    title: varchar("title", { length: 256 }),
    indexStatus: varchar("index_status", { length: 32 }).notNull().default("pending"),
    textSource: varchar("text_source", { length: 32 }).default("native"),
    createdAt,
    updatedAt,
  },
  (table) => [
    foreignKey({
      columns: [table.uploadedByCarId],
      foreignColumns: [cars.id],
      name: "fk_service_manuals_cars",
    }),
  ]
)

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

export const carSystems = createTable(
  "car_systems",
  {
    id,
    carId: nanoid("car_id").notNull(),
    system: varchar("system", { length: 256 }).notNull(),
    service: varchar("service", { length: 256 }).notNull(),
    maintenanceIntervalMiles: integer("maintenance_interval_miles"),
    maintenanceIntervalDays: integer("maintenance_interval_days"),
    inspectionIntervalDays: integer("inspection_interval_days"),
    lastReplacedAt: timestamp("last_replaced_at"),
    lastReplacedOdometer: integer("last_replaced_odometer"),
    lastInspectedAt: timestamp("last_inspected_at"),
    createdAt,
    updatedAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_car_systems_cars",
    }),
  ]
)

export const inspectionLog = createTable(
  "inspection_log",
  {
    id,
    carId: nanoid("car_id").notNull(),
    carSystemId: nanoid("car_system_id"),
    system: varchar("system", { length: 256 }).notNull(),
    service: varchar("service", { length: 256 }).notNull(),
    inspectedAt: timestamp("inspected_at").notNull(),
    result: varchar("result", { length: 32 }).notNull(),
    notes: text("notes"),
    odometer: integer("odometer"),
    maintenanceLogId: nanoid("maintenance_log_id"),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_inspection_log_cars",
    }),
    foreignKey({
      columns: [table.carSystemId],
      foreignColumns: [carSystems.id],
      name: "fk_inspection_log_car_systems",
    }),
    foreignKey({
      columns: [table.maintenanceLogId],
      foreignColumns: [maintenanceLog.id],
      name: "fk_inspection_log_maintenance_log",
    }),
  ]
)

export const inspectionFiles = createTable(
  "inspection_files",
  {
    id,
    inspectionLogId: nanoid("inspection_log_id").notNull(),
    fileType: varchar("file_type", { length: 256 }).notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    fileSize: integer("file_size"),
    fileUrl: varchar("file_url", { length: 512 }).notNull(),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.inspectionLogId],
      foreignColumns: [inspectionLog.id],
      name: "fk_inspection_files_inspection_log",
    }),
  ]
)

export const pushSubscriptions = createTable(
  "push_subscriptions",
  {
    id,
    carId: nanoid("car_id").notNull(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_push_subscriptions_cars",
    }),
  ]
)

export const notificationPreferences = createTable(
  "notification_preferences",
  {
    id,
    carId: nanoid("car_id").notNull().unique(),
    pushEnabled: boolean("push_enabled").notNull().default(false),
    maintenanceOverdue: boolean("maintenance_overdue").notNull().default(true),
    inspectionOverdue: boolean("inspection_overdue").notNull().default(true),
    inspectionUpcoming: boolean("inspection_upcoming").notNull().default(true),
    upcomingLeadDays: integer("upcoming_lead_days").notNull().default(7),
    frequency: varchar("frequency", { length: 32 }).notNull().default("daily"),
    repeatOverdueDays: integer("repeat_overdue_days").notNull().default(7),
    createdAt,
    updatedAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_notification_preferences_cars",
    }),
  ]
)

export const notificationLog = createTable(
  "notification_log",
  {
    id,
    carId: nanoid("car_id").notNull(),
    systemId: nanoid("system_id").notNull(),
    reminderType: varchar("reminder_type", { length: 64 }).notNull(),
    sentAt: timestamp("sent_at").notNull().defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_notification_log_cars",
    }),
    foreignKey({
      columns: [table.systemId],
      foreignColumns: [carSystems.id],
      name: "fk_notification_log_car_systems",
    }),
  ]
)

export const serviceManualPages = createTable(
  "service_manual_pages",
  {
    id,
    serviceManualId: nanoid("service_manual_id").notNull(),
    pageNumber: integer("page_number").notNull(),
    textContent: text("text_content").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.serviceManualId],
      foreignColumns: [serviceManuals.id],
      name: "fk_service_manual_pages_service_manuals",
    }),
  ]
)

export const serviceManualSuggestedBookmarks = createTable(
  "service_manual_suggested_bookmarks",
  {
    id,
    serviceManualId: nanoid("service_manual_id").notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    pageNumber: integer("page_number").notNull(),
    category: varchar("category", { length: 256 }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    foreignKey({
      columns: [table.serviceManualId],
      foreignColumns: [serviceManuals.id],
      name: "fk_service_manual_suggested_bookmarks_service_manuals",
    }),
  ]
)

export const serviceManualUserBookmarks = createTable(
  "service_manual_user_bookmarks",
  {
    id,
    carId: nanoid("car_id").notNull(),
    serviceManualId: nanoid("service_manual_id").notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    pageNumber: integer("page_number").notNull(),
    createdAt,
  },
  (table) => [
    foreignKey({
      columns: [table.carId],
      foreignColumns: [cars.id],
      name: "fk_service_manual_user_bookmarks_cars",
    }),
    foreignKey({
      columns: [table.serviceManualId],
      foreignColumns: [serviceManuals.id],
      name: "fk_service_manual_user_bookmarks_service_manuals",
    }),
  ]
)
