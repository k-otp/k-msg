/**
 * Represents a successful result containing a value.
 */
export type Ok<T> = {
  /** Always true for successful results. */
  readonly isSuccess: true;
  /** Always false for successful results. */
  readonly isFailure: false;
  /** The contained success value. */
  readonly value: T;
};

/**
 * Represents a failed result containing an error.
 */
export type Fail<E> = {
  /** Always false for failed results. */
  readonly isSuccess: false;
  /** Always true for failed results. */
  readonly isFailure: true;
  /** The contained error. */
  readonly error: E;
};

/**
 * A result type that represents either success (Ok) or failure (Fail).
 * Used throughout k-msg for explicit error handling without exceptions.
 *
 * @template T - The type of the success value
 * @template E - The type of the error (defaults to Error)
 *
 * @example
 * ```ts
 * function divide(a: number, b: number): Result<number, string> {
 *   if (b === 0) return fail("division by zero");
 *   return ok(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isSuccess) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> = Ok<T> | Fail<E>;

/**
 * Create a successful result containing the given value.
 * @param value - The success value to wrap
 * @returns An Ok result containing the value
 */
export const ok = <T>(value: T): Ok<T> => ({
  isSuccess: true,
  isFailure: false,
  value,
});

/**
 * Create a failed result containing the given error.
 * @param error - The error to wrap
 * @returns A Fail result containing the error
 */
export const fail = <E>(error: E): Fail<E> => ({
  isSuccess: false,
  isFailure: true,
  error,
});

/**
 * Result utility functions for chaining and transformation
 */
export const Result = {
  /**
   * Transform the success value of a Result
   */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    if (result.isSuccess) {
      return ok(fn(result.value));
    }
    return result;
  },

  /**
   * Chain Result-returning operations
   */
  flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    if (result.isSuccess) {
      return fn(result.value);
    }
    return result;
  },

  /**
   * Transform the error of a Result
   */
  mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    if (result.isFailure) {
      return fail(fn(result.error));
    }
    return result;
  },

  /**
   * Extract the value or throw the error
   */
  unwrap<T, E>(result: Result<T, E>): T {
    if (result.isSuccess) {
      return result.value;
    }
    throw result.error;
  },

  /**
   * Extract the value or return a default
   */
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    if (result.isSuccess) {
      return result.value;
    }
    return defaultValue;
  },

  /**
   * Extract the value or compute a default from the error
   */
  unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
    if (result.isSuccess) {
      return result.value;
    }
    return fn(result.error);
  },

  /**
   * Pattern match on a Result
   */
  match<T, E, U>(
    result: Result<T, E>,
    handlers: { ok: (value: T) => U; fail: (error: E) => U },
  ): U {
    if (result.isSuccess) {
      return handlers.ok(result.value);
    }
    return handlers.fail(result.error);
  },

  /**
   * Convert a Promise to a Result
   */
  async fromPromise<T, E = Error>(promise: Promise<T>): Promise<Result<T, E>> {
    try {
      const value = await promise;
      return ok(value);
    } catch (error) {
      return fail(error as E);
    }
  },

  /**
   * Check if a Result is Ok
   */
  isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.isSuccess;
  },

  /**
   * Check if a Result is Fail
   */
  isFail<T, E>(result: Result<T, E>): result is Fail<E> {
    return result.isFailure;
  },
};
