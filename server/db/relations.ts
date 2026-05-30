// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
import { defineRelations } from "drizzle-orm"

import * as schema from "./schema"

export const relations = defineRelations(schema, (r) => ({
  cars: {
    images: r.many.carImages(),
    files: r.many.carFiles(),
    maintenanceLogs: r.many.maintenanceLog(),
    gasLogs: r.many.gasLog(),
    wishlist: r.many.wishlist(),
    sessions: r.many.carSessions(),
  },
  carImages: {
    car: r.one.cars({
      from: r.carImages.carId,
      to: r.cars.id,
    }),
  },
  carFiles: {
    car: r.one.cars({
      from: r.carFiles.carId,
      to: r.cars.id,
    }),
  },
  carSessions: {
    car: r.one.cars({
      from: r.carSessions.carId,
      to: r.cars.id,
    }),
  },
  maintenanceLog: {
    car: r.one.cars({
      from: r.maintenanceLog.carId,
      to: r.cars.id,
    }),
    maintenanceParts: r.many.maintenanceParts(),
    files: r.many.maintenanceFiles(),
  },
  maintenanceParts: {
    log: r.one.maintenanceLog({
      from: r.maintenanceParts.maintenanceLogId,
      to: r.maintenanceLog.id,
    }),
  },
  maintenanceFiles: {
    log: r.one.maintenanceLog({
      from: r.maintenanceFiles.maintenanceLogId,
      to: r.maintenanceLog.id,
    }),
  },
  gasLog: {
    car: r.one.cars({
      from: r.gasLog.carId,
      to: r.cars.id,
    }),
  },
  wishlist: {
    car: r.one.cars({
      from: r.wishlist.carId,
      to: r.cars.id,
    }),
  },
}))
