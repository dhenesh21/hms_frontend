/**
 * Recursively removes empty-string, whitespace-only, and NaN values from an
 * object/array so they are omitted from the JSON payload sent to the API.
 *
 * Why this exists:
 * The backend (FastAPI/Pydantic) defines most optional numeric/date fields as
 * `Optional[float] = None` / `Optional[int] = None` / `Optional[date] = None`.
 * Pydantic v2 accepts `null` (key omitted) for these but REJECTS an empty
 * string `""` with a 422 "unable to parse string as a number" error.
 *
 * React Hook Form leaves untouched/cleared number, date, and select inputs as
 * `""`, so submitting a form where some optional fields are left blank (very
 * common — e.g. OPD vitals, IPD vitals, EMR entries, Lab/Radiology orders,
 * Billing, Pharmacy, Insurance, HR, etc.) would otherwise throw a 422 even
 * though the request is logically valid.
 *
 * Usage:
 *   await opdService.createVisit(cleanPayload(payload))
 */
export function cleanPayload<T = any>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanPayload(item)) as unknown as T
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value as Record<string, any>)) {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed === '') continue // omit empty strings entirely
        result[key] = val
      } else if (typeof val === 'number' && Number.isNaN(val)) {
        continue // omit NaN
      } else if (val === undefined) {
        continue
      } else if (val !== null && typeof val === 'object') {
        result[key] = cleanPayload(val)
      } else {
        result[key] = val
      }
    }
    return result as unknown as T
  }

  return value
}

/**
 * Like cleanPayload, but converts removed/blank values to `null` instead of
 * omitting the key. Useful for PATCH/PUT payloads where the backend should
 * explicitly clear a previously-set value rather than leave it unchanged.
 */
export function cleanPayloadNullable<T = any>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => cleanPayloadNullable(item)) as unknown as T
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const result: Record<string, any> = {}
    for (const [key, val] of Object.entries(value as Record<string, any>)) {
      if (typeof val === 'string') {
        const trimmed = val.trim()
        result[key] = trimmed === '' ? null : val
      } else if (typeof val === 'number' && Number.isNaN(val)) {
        result[key] = null
      } else if (val === undefined) {
        result[key] = null
      } else if (val !== null && typeof val === 'object') {
        result[key] = cleanPayloadNullable(val)
      } else {
        result[key] = val
      }
    }
    return result as unknown as T
  }

  return value
}

/**
 * Parses a value to a number, returning `undefined` if it is blank/NaN so the
 * key can be safely spread into a payload without sending an empty string or
 * NaN for an Optional[int]/Optional[float] field.
 */
export function toOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

/**
 * Parses a value to a number for a REQUIRED int/float field. Returns
 * `undefined` if blank/NaN so cleanPayload can omit it, letting the backend
 * return a clear "field required" 422 instead of an integer-parsing error.
 */
export function toRequiredNumber(value: unknown): number | undefined {
  return toOptionalNumber(value)
}
