export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const clampedPage = Math.min(Math.max(page, 1), totalPages)
  const start = (clampedPage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: clampedPage,
    pageSize,
    totalPages,
  }
}

export function parsePageParam(value: string | null): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

export function parseLimitParam(
  value: string | null,
  defaultLimit: number,
  maxLimit: number
): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return defaultLimit
  return Math.min(Math.floor(n), maxLimit)
}
