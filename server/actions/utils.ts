export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export function assertCarOwnsResource(
  carId: string,
  resourceCarId: string | undefined | null
) {
  if (!resourceCarId || resourceCarId !== carId) {
    throw new UnauthorizedError()
  }
}

export function actionError(error: string): ActionResult<never> {
  return { success: false, error }
}

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function actionErrorFromUnknown(e: unknown, fallback: string): ActionResult<never> {
  if (e instanceof UnauthorizedError) {
    return actionError("Unauthorized")
  }
  return actionError(e instanceof Error ? e.message : fallback)
}
