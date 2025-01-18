/**
 * Error thrown when an operation is aborted.
 */
export class AbortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AbortError";
  }
}
