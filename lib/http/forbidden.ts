export class ForbiddenError extends Error {
  readonly status = 403 as const

  constructor(message = "Nu ai permisiunea de a face această acțiune.") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError || (error instanceof Error && error.name === "ForbiddenError")
}
